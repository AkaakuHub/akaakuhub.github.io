import HomeClient from "@/features/home/home-client";
import { getReposForHome } from "@/lib/github";

export default async function Page() {
  const repos = await getReposForHome({ limit: 60 });
  return <HomeClient repos={repos} />;
}
