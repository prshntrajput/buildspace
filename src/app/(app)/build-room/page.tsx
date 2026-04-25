import { redirect } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth/server";
import { productRepository } from "@/modules/product/repositories/product.repository";
import { teamRepository } from "@/modules/team/repositories/team.repository";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Hammer, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Build Rooms — BuildSpace",
};

export default async function BuildRoomsPage() {
  const authUser = await getUser().catch(() => null);
  if (!authUser) redirect("/login");

  // Products owned by the user
  const ownedProducts = await productRepository.listByOwner(authUser.id).catch(() => []);
  const ownedProductIds = ownedProducts.map((p) => p.id);

  // Products where user is a team member (not necessarily owner)
  const memberProductIds = await teamRepository.listProductIdsByMember(authUser.id).catch(() => []);

  // All unique product IDs — deduplicated
  const allProductIds = Array.from(new Set([...ownedProductIds, ...memberProductIds]));

  const buildRooms = await productRepository
    .listBuildRoomsByProductIds(allProductIds)
    .catch(() => []);

  const ownedSet = new Set(ownedProductIds);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Hammer className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Build Rooms</h1>
      </div>

      {buildRooms.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Hammer className="h-10 w-10 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">
            No build rooms yet. Start building a product or join a team to see rooms here.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link href="/products" className="text-sm text-primary underline underline-offset-4">
              Browse products
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {buildRooms.map((room) => (
            <Link key={room.id} href={`/build-room/${room.id}`}>
              <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{room.title}</p>
                      <span className="text-muted-foreground text-xs">·</span>
                      <span className="text-xs text-muted-foreground truncate">{room.productName}</span>
                      <Badge variant={ownedSet.has(room.productId) ? "default" : "secondary"} className="text-[10px] py-0 ml-auto shrink-0">
                        {ownedSet.has(room.productId) ? "Owner" : "Member"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={room.progressPct} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground shrink-0">{room.progressPct}%</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
