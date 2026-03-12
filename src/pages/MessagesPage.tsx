import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockMessages = [
  { id: 1, name: "Sarah M.", preview: "I think I saw your dog near the park!", time: "10 min ago", unread: true },
  { id: 2, name: "Happy Paws Shelter", preview: "We have a cat matching your description.", time: "1 hour ago", unread: true },
  { id: 3, name: "John D.", preview: "Thank you for finding my cat!", time: "Yesterday", unread: false },
];

export default function MessagesPage() {
  return (
    <div className="page-container max-w-2xl">
      <h1 className="page-title">
        <MessageSquare className="inline h-7 w-7 text-primary mr-2" />
        Messages
      </h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search messages..." className="pl-10" />
      </div>

      <div className="space-y-2">
        {mockMessages.map((m) => (
          <Card key={m.id} className="card-hover cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{m.name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-heading ${m.unread ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </div>
                <p className={`text-sm truncate ${m.unread ? "text-foreground" : "text-muted-foreground"}`}>{m.preview}</p>
              </div>
              {m.unread && <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
