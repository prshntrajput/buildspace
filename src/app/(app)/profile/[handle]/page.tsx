import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { getUserOrNull } from "@/lib/auth/server";
import { userService } from "@/modules/user/services/user.service";
import { productService } from "@/modules/product/services/product.service";
import { ideaService } from "@/modules/idea/services/idea.service";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/modules/product/components/product-card";
import { IdeaCard } from "@/modules/idea/components/idea-card";
import { formatDate } from "@/lib/utils";
import { ReportButton } from "@/modules/moderation/components/report-button";
import { MapPin, Globe, Calendar } from "lucide-react";

type Props = { params: Promise<{ handle: string }> };

const RANK_VARIANT: Record<string, "bronze" | "silver" | "gold" | "platinum"> = {
  bronze: "bronze",
  silver: "silver",
  gold: "gold",
  platinum: "platinum",
};

const AVAILABILITY_LABEL: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  weekends: "Weekends only",
  unavailable: "Unavailable",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const user = await userService.getPublicProfile(handle).catch(() => null);
  if (!user) return { title: "Profile Not Found" };
  return {
    title: `${user.displayName} (@${user.handle}) — BuildSpace`,
    description: user.bio ?? `${user.displayName} is building in public on BuildSpace.`,
  };
}

export default async function ProfilePage({ params }: Props) {
  const { handle } = await params;
  const authUser = await getUserOrNull();
  const profile = await userService.getPublicProfile(handle).catch(() => null);

  if (!profile) notFound();

  const isOwn = authUser?.id === profile.id;

  const [products, ideas] = await Promise.all([
    productService.listByOwner(profile.id).catch(() => []),
    ideaService.getUserIdeas(profile.id, authUser?.id).catch(() => []),
  ]);

  const publicProducts = products.filter((p) => p.visibility === "public");
  const publicIdeas = ideas.filter((i) => i.visibility === "public" && i.status === "published");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">
                {profile.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{profile.displayName}</h1>
                <Badge variant={RANK_VARIANT[profile.rankBucket] ?? "bronze"}>
                  {profile.rankBucket}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">@{profile.handle}</p>
              {profile.bio && (
                <p className="text-sm mt-2 leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                {profile.timezone && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {profile.timezone}
                  </span>
                )}
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Globe className="h-3 w-3" />
                    Website
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>
            </div>
            {isOwn ? (
              <Link href="/settings/profile">
                <Button variant="outline" size="sm">Edit Profile</Button>
              </Link>
            ) : authUser && (
              <ReportButton targetType="user" targetId={profile.id} />
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{publicProducts.length}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{publicIdeas.length}</p>
              <p className="text-xs text-muted-foreground">Ideas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold capitalize">{AVAILABILITY_LABEL[profile.availability] ?? profile.availability}</p>
              <p className="text-xs text-muted-foreground">Availability</p>
            </div>
          </div>

          {/* Skills */}
          {profile.skills.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">Skills</p>
              <div className="flex flex-wrap gap-1">
                {profile.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products ({publicProducts.length})</TabsTrigger>
          <TabsTrigger value="ideas">Ideas ({publicIdeas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4">
          {publicProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No public products yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publicProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ideas" className="mt-4">
          {publicIdeas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No published ideas yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publicIdeas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
