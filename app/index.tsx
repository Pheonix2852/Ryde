import { Redirect } from "expo-router";
import "../global.css";

export default function Home() {
  return <Redirect href={"/(root)/(auth)/welcome"} />;
}
