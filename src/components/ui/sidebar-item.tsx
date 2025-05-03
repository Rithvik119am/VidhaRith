 import { Button } from "@/components/ui/button";
 import { cn } from "@/lib/utils";

 interface SidebarItemProps {
   icon: React.ReactNode;
   children: React.ReactNode;
   active?: boolean;
 }

 export function SidebarItem({ icon, children, active }: SidebarItemProps) {
   return (
     <Button
       variant="ghost"
       className={cn(
         "w-full justify-start",
         active && "bg-muted" // Apply active state styles
       )}
     >
       <span className="mr-2">{icon}</span>
       {children}
     </Button>
   );
 }