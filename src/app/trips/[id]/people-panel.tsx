import { Avatar } from "@/components/avatar";
import { InviteLink } from "@/components/invite-link";

export type TripMember = {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
};

export function PeoplePanel({
  tripName,
  inviteCode,
  members,
}: {
  tripName: string;
  inviteCode: string;
  members: TripMember[];
}) {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Invite friends</h2>
        <p className="text-sm text-muted-foreground">Anyone with this link can join the trip.</p>
        <InviteLink code={inviteCode} tripName={tripName} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Members</h2>
        <ol className="flex flex-col md:grid md:grid-cols-2 md:gap-x-6">
          {members.map((member, index) => (
            <li
              key={member.id}
              className="flex items-center gap-4 rounded-md px-2 py-2.5 transition-colors hover:bg-card"
            >
              <span className="w-4 text-right text-sm text-muted-foreground tabular-nums">{index + 1}</span>
              <Avatar name={member.name} url={member.avatarUrl} />
              <span className="flex-1 truncate font-medium">{member.name}</span>
              {member.role === "owner" && <span className="text-xs font-semibold text-primary">Owner</span>}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
