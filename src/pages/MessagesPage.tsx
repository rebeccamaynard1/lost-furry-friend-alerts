import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Link, useSearchParams } from "react-router-dom";

type Conversation = {
  user_id: string;
  name: string;
  last_message: string;
  last_time: string;
  unread: number;
};

type Message = {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean | null;
};

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Handle ?to= query param
  useEffect(() => {
    if (!user) return;
    const toUserId = searchParams.get("to");
    if (toUserId && toUserId !== user.id) {
      supabase.rpc("get_profile_display_name", { _user_id: toUserId }).then(({ data }) => {
        setSelectedUser(toUserId);
        setSelectedName(data?.[0]?.name || "User");
      });
    }
  }, [user, searchParams]);

  // Fetch conversations
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("id, content, sender_id, receiver_id, created_at, read")
        .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      const convMap = new Map<string, { msgs: typeof data }>();
      data.forEach((m) => {
        const otherId = m.sender_id === user!.id ? m.receiver_id : m.sender_id;
        if (!convMap.has(otherId)) convMap.set(otherId, { msgs: [] });
        convMap.get(otherId)!.msgs.push(m);
      });

      const otherIds = Array.from(convMap.keys());
      const { data: profiles } = otherIds.length > 0
        ? await supabase.rpc("get_profile_display_names", { _user_ids: otherIds })
        : { data: [] };

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.name || "Unknown"]));

      const convs: Conversation[] = otherIds.map((uid) => {
        const msgs = convMap.get(uid)!.msgs;
        const unread = msgs.filter((m) => m.receiver_id === user!.id && !m.read).length;
        return {
          user_id: uid,
          name: profileMap.get(uid) || "Unknown",
          last_message: msgs[0].content,
          last_time: msgs[0].created_at,
          unread,
        };
      });

      setConversations(convs);
      setLoading(false);
    }
    load();
  }, [user]);

  // Fetch messages for selected conversation (paginated, newest 50)
  const PAGE_SIZE = 50;
  const [hasMore, setHasMore] = useState(false);
  useEffect(() => {
    if (!selectedUser || !user) return;
    async function loadMsgs() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user!.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user!.id})`)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE + 1);
      const rows = (data || []).slice(0, PAGE_SIZE).reverse();
      setHasMore((data || []).length > PAGE_SIZE);
      setMessages(rows);

      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", selectedUser)
        .eq("receiver_id", user!.id)
        .eq("read", false);
    }
    loadMsgs();
  }, [selectedUser, user]);

  const loadOlderMessages = async () => {
    if (!selectedUser || !user || messages.length === 0) return;
    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser}),and(sender_id.eq.${selectedUser},receiver_id.eq.${user.id})`)
      .lt("created_at", oldest)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE + 1);
    const rows = (data || []).slice(0, PAGE_SIZE).reverse();
    setHasMore((data || []).length > PAGE_SIZE);
    setMessages((prev) => [...rows, ...prev]);
  };

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (msg.sender_id === user.id || msg.receiver_id === user.id) {
          if (selectedUser && (msg.sender_id === selectedUser || msg.receiver_id === selectedUser)) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUser]);

  const handleSend = async () => {
    if (!newMsg.trim() || !user || !selectedUser) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      content: newMsg.trim(),
    });
    if (error) toast.error(error.message);
    else setNewMsg("");
    setSending(false);
  };

  if (!user) {
    return (
      <div className="page-container text-center py-20">
        <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Sign in to view messages.</p>
        <Button asChild variant="hero"><Link to="/login">Sign In</Link></Button>
      </div>
    );
  }

  // Chat view
  if (selectedUser) {
    return (
      <div className="page-container max-w-2xl flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-bold text-primary">{selectedName[0]}</span>
          </div>
          <span className="font-heading font-bold text-foreground">{selectedName}</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {hasMore && (
            <div className="flex justify-center pb-2">
              <Button variant="ghost" size="sm" onClick={loadOlderMessages}>Load older messages</Button>
            </div>
          )}
          {messages.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === user.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.sender_id === user.id
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}>
                {m.content}
                <p className={`text-[10px] mt-1 ${m.sender_id === user.id ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} disabled={sending || !newMsg.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div className="page-container max-w-2xl">
      <h1 className="page-title">
        <MessageSquare className="inline h-7 w-7 text-primary mr-2" />Messages
      </h1>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : conversations.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">No messages yet.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => (
            <Card
              key={c.user_id}
              className="card-hover cursor-pointer"
              onClick={() => { setSelectedUser(c.user_id); setSelectedName(c.name); }}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{c.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-heading ${c.unread > 0 ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{c.name}</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.last_time), { addSuffix: true })}</span>
                  </div>
                  <p className={`text-sm truncate ${c.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>{c.last_message}</p>
                </div>
                {c.unread > 0 && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-primary-foreground">{c.unread}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
