import HomeClient from "@/features/home/home-client";
import { getRepos } from "@/lib/github";

export default async function Page() {
  const repos = await getRepos();
  return <HomeClient repos={repos} />;
}
