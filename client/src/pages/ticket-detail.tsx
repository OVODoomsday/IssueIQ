
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [note, setNote] = useState("");

  const { data: ticket, isLoading } = useQuery({
    queryKey: [`/api/tickets/${id}`],
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/tickets/${id}/notes`, { text: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${id}`] });
      setNote("");
      toast({ title: "Note added successfully" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{ticket.title}</CardTitle>
          <div className="flex gap-2 mt-2">
            <Badge>{ticket.priority}</Badge>
            <Badge variant="outline">{ticket.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="mt-2">{ticket.description}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="space-y-4 mt-2">
                {ticket.notes?.map((note: any, i: number) => (
                  <div key={i} className="bg-muted p-4 rounded-lg">
                    <p>{note.text}</p>
                    <div className="text-sm text-muted-foreground mt-2">
                      Added by {note.createdBy} on {new Date(note.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {user?.role === "admin" && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Add Note</h3>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Enter your note here..."
                  className="mb-2"
                />
                <Button 
                  onClick={() => addNoteMutation.mutate()}
                  disabled={!note || addNoteMutation.isPending}
                >
                  {addNoteMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Note
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
