# App Flow Document for Bracket Master Challenge

## Onboarding and Sign-In/Sign-Up

When a new user opens the web app on their mobile device, they arrive at the dark-themed Bracket Master Challenge landing screen. The page features the app logo and three sign-in buttons labeled Google, Apple, and Discord. Tapping any of these buttons launches the corresponding OAuth flow. The user is prompted by the provider to grant basic profile access, such as email and avatar. Once the provider confirms the user’s identity, the app displays a brief privacy policy notice and then automatically redirects the user to the Main Landing Page. If at any time the user wishes to switch accounts or sign out, they can tap their small avatar icon in the header, choose Sign Out, and the app will return to the initial sign-in screen. Since authentication relies solely on social login, there is no traditional password recovery flow required.

## Main Dashboard or Home Page

After sign-in, the user lands on the Main Dashboard, which doubles as the Home Page. At the top is the Bracket Master Challenge header styled in neon green on a dark background. Below the header sits a short introduction to the current tournament alongside a clearly marked Rules section. Just beneath the rules is a large call-to-action button inviting the user to begin their prediction. In the top right corner of the screen, the user’s avatar or initials indicate their signed-in status. Tapping that avatar reveals a small overlay menu with options to Sign Out or navigate back to this Home Page at any time. The overall layout uses a glassmorphism effect, with subtle animations guiding the user’s attention to the Start Prediction button.

## Detailed Feature Flows and Page Transitions

When the user taps Start Prediction, the app transitions to the Prediction Interface. This page splits the screen into two scrollable panels. The left panel lists the sixteen placeholder participants labeled Player 1 through Player 16. Each name appears on a dark card that pulses slightly when touched. The right panel shows eight outlined slots labeled First through Eighth place, each slot glowing faintly to signal readiness. Initially, the Submit Prediction button at the bottom is disabled and grayed out.

To make a prediction, the user first taps a participant card on the left. That card highlights in neon green and floats slightly, inviting the user to choose a slot on the right. Tapping an empty slot moves the highlighted card into that slot and anchors it there. If the user taps the first-place slot, that slot gains a special champion glow to signify the importance of the pick. After each placement, focus automatically returns to the left panel so the user can select the next participant. The right panel always shows the current set of chosen players, each with a small trash icon in its corner. If the user taps that trash icon, the player card returns to the left panel, the slot empties, and the glow effect resets.

Once all eight slots are filled, the Submit Prediction button animates with a pulsing glow. Tapping it opens a confirmation dialog asking the user to confirm their choices. If the user confirms, the app displays a loading spinner while it saves the prediction to the Supabase database. On success, the app moves to the Complete Prediction Confirmation screen. This page shows a checkmark animation, a recap of the user’s top-8 bracket, and two navigation buttons labeled View Leaderboard and Return Home.

From the Complete Prediction Confirmation screen, if the user taps View Leaderboard, the app transitions to the Leaderboard page. Here, the app fetches all user scores and sorts them by the defined point structure. The user sees names, avatars, and total points in descending order. This page updates in real time if new tournament results have been entered.

In parallel to the user experience, authorized admins can visit a separate Admin Results Interface by navigating to an internal admin URL. On this page, the admin enters the actual tournament outcomes for First through Eighth place. Once the admin saves the results, the system recalculates every user’s score according to the eight-point, sixteen-point, and champion multipliers. The live Leaderboard page then reflects these new scores instantly. The Admin Results Interface also allows the admin to view the cutoff timestamp and toggle the prediction window lock. After the cutoff time passes, the Prediction Interface’s Submit button is disabled and a lock icon and message appear, preventing further edits.

## Settings and Account Management

Users can access account controls via the avatar icon in the top right of any authenticated page. The only available setting at launch is Sign Out. The user taps Sign Out and the app clears their session and returns them to the sign-in screen. In future versions, this menu may include options for notification preferences or language selection, but for now it remains focused on simple, low-friction account handling.

## Error States and Alternate Paths

If the social login flow fails due to network issues or provider errors, the app displays a full-screen error message explaining that sign-in could not be completed and prompts the user to retry. While browsing the Prediction Interface, if the connection drops during a save, a banner appears at the top explaining that saving failed and inviting the user to tap a Retry button, which re-fires the save. Attempting to submit an incomplete bracket keeps the Submit button disabled and a tooltip appears over it reminding the user to fill all eight slots. After the tournament cutoff, trying to make or edit a submission shows a locked-out view in the Prediction Interface with a clear message that predictions are closed. Any unexpected server errors on pages such as Leaderboard or Admin Results bring up a generic apology screen with a Refresh button to reload the page.

## Conclusion and Overall App Journey

From the first moment a spectator lands on the Bracket Master Challenge sign-in screen to the thrill of seeing their name rise on the live Leaderboard, the app leads users through a simple and engaging mobile experience. They sign on with a social account, learn the tournament rules, make eight smooth, visually guided selections, confirm their bracket, and then follow along as real results turn predictions into points. Behind the scenes, admins enter results and enforce the cutoff, and the app delivers real-time updates that keep spectators returning for more friendly competition.
