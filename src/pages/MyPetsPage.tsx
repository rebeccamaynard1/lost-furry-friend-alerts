import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PawPrint, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const mockPets = [
  { id: 1, name: "Buddy", species: "Dog", breed: "Golden Retriever", status: "lost", date: "Mar 5, 2026" },
  { id: 2, name: "Whiskers", species: "Cat", breed: "Tabby", status: "reunited", date: "Feb 20, 2026" },
];

export default function MyPetsPage() {
  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">
          <PawPrint className="inline h-7 w-7 text-primary mr-2" />
          My Pets
        </h1>
        <Button asChild variant="hero" className="rounded-xl">
          <Link to="/report-lost"><Plus className="h-4 w-4 mr-1" /> Add Pet</Link>
        </Button>
      </div>

      {mockPets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <PawPrint className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-muted-foreground">No pets registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mockPets.map((pet) => (
            <Card key={pet.id} className="card-hover cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <PawPrint className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-foreground">{pet.name}</h3>
                  <p className="text-sm text-muted-foreground">{pet.breed} · {pet.species}</p>
                </div>
                <div className="text-right">
                  <Badge variant={pet.status === "lost" ? "destructive" : "default"} className={pet.status === "reunited" ? "bg-found text-primary-foreground" : ""}>
                    {pet.status === "lost" ? <AlertTriangle className="h-3 w-3 mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {pet.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{pet.date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
