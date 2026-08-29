import ExploreClient from "./explore-client";
import { preparedRoute, zones } from "@/lib/eyeearn-data";

export default function ExplorePage() {
  return <ExploreClient zones={zones} route={preparedRoute} />;
}
