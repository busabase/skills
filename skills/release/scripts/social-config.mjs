// Release social publishing configuration.
//
// Store secrets as base64 strings here only after the repository owner approves
// the channel setup. Leave values empty when the channel is not configured.
//
// Discord:
//   DISCORD_WEBHOOK_URL_B64 = base64("https://discord.com/api/webhooks/...")
//
// X / Twitter (OAuth 1.0a):
//   X_OAUTH1_B64 = base64(JSON.stringify({
//     consumerKey: "...",
//     consumerSecret: "...",
//     accessToken: "...",
//     accessTokenSecret: "..."
//   }))
//
//   Generate with:
//     node -e "console.log(Buffer.from(JSON.stringify({consumerKey:'...',consumerSecret:'...',accessToken:'...',accessTokenSecret:'...'})).toString('base64'))"
//
// Do not commit real production credentials unless that is the accepted
// repository policy for this private skill directory.

export const DISCORD_WEBHOOK_URL_B64 =
  "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTQ5NTk2NzYzNTI1MzIzNTc1Mi9ydUg1QXRsYTBrdVN1QXlEbFhPTHU4MmVLY21aNmdqVkpJRXRvbF9IQ1Z6QnJIT28wakpwNmdtVjlDUGpJd2xiN1JtZQ==";
export const X_OAUTH1_B64 =
  "eyJjb25zdW1lcktleSI6IklneGNFWHFRbUJQVlRvd0hFdmU2dXhwWHEiLCJjb25zdW1lclNlY3JldCI6Im11Q1JxMDNpS2t0TlhzVmJLWm1EaTJ6bGM4UzVrNHBzc2pKd0dJcDhDcUdXZExCUkFlIiwiYWNjZXNzVG9rZW4iOiIyMDQyMDcwMjkzNjAzMDkwNDMyLW1nbU9TR2haNVR2WWZESHdNTVdlVWYyQ3d3Y2dyTyIsImFjY2Vzc1Rva2VuU2VjcmV0IjoiSFBsY1gzd3FTcHdkaDZaWjRpUnVWV0dOZTFjbWFaY3VIZ2JzMGNTY3I0ZXJpIn0=";
