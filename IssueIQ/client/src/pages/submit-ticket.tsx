import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketForm } from "@/components/tickets/ticket-form";

export default function SubmitTicket() {
  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Submit a New Ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
