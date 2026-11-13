export async function getProvider() {
  if (new URLSearchParams(window.location.search).get("demo") === "1") {
    return (await import("./demo-provider.js")).demoProvider;
  }
  const { getRuntime } = await import("../runtime.js");
  if ((await getRuntime()).runtime === "site")
    return (await import("./site-provider.js")).siteProvider;
  return (await import("./busabase-provider.js")).busabaseProvider;
}
