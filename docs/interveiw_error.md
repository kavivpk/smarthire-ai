# SmartHire AI — Fix Blank Question Screen in AI Interview

## Bug

After the proctoring setup (camera/mic/screen-share/fullscreen) completes
and the candidate reaches the actual test (Aptitude / Coding / Tech Q&A
tabs are visible at the top, "Monitored" indicator is showing bottom-right,
screen share is active), the **main content area is completely blank/black
— no question, no answer input, nothing renders.**

This means the proctoring wrapper works, but whatever is supposed to render
inside it (the actual test content) is not showing up. Fix this fully, then
verify the entire AI Interview flow works end to end.

---

## Step 1 — Diagnose before fixing

Do not guess and patch blindly. Do these checks first and report findings:

1. **Open the browser console on this exact screen** and report any errors.
   A blank screen like this is very often caused by:
   - A JavaScript error thrown during render that crashes the component
     tree silently (React will unmount everything below the crash point if
     there's no error boundary)
   - A failed API call for the questions data that isn't being caught,
     leaving the component stuck trying to render `undefined`/`null` data
2. **Check the Network tab** for the request that fetches Aptitude/Coding/
   Tech Q&A questions on this screen — confirm whether it's firing at all,
   what status code it returns, and what the response body actually
   contains. If it's returning an error or empty data, that's the root
   cause and needs to be fixed at the source (the API route), not just
   patched on the frontend.
3. **Check the component tree**: find the component responsible for
   rendering the actual question content within the proctoring-wrapped
   test screen. Confirm:
   - Is it actually being rendered as a child of the proctoring wrapper,
     or did the wrapper component's JSX accidentally omit `{children}`
     somewhere when it was built in the previous phase?
   - Is there a loading state that's stuck `true` forever because the data
     fetch that would set it to `false` never resolves or errors silently?
4. Report what you find from steps 1-3 before writing any fix.

---

## Step 2 — Fix based on the diagnosis

Depending on what Step 1 reveals, the fix will be one of:

- **If it's a silent crash**: fix the actual error, and also add a basic
  error boundary or try/catch fallback UI around the test content area so
  future errors show a visible error message instead of a blank screen
  (much easier to debug going forward).
- **If it's a failed/empty data fetch**: fix the API route or the
  frontend's data-fetching logic so it either returns valid question data
  or shows a clear "Failed to load questions, please retry" message
  instead of silently rendering nothing.
- **If `{children}` was dropped from the proctoring wrapper's JSX**: fix
  the wrapper component to correctly render its children while still
  applying the camera/fullscreen/violation-monitoring logic around them.
- **If a loading state never resolves**: fix whatever async logic was
  supposed to flip it to `false`/`loaded`, and add a timeout fallback
  (e.g. after 15 seconds show "This is taking longer than expected" with
  a retry button) so it never hangs indefinitely again.

---

## Step 3 — Verify the entire AI Interview flow end to end

Once the blank screen is fixed, do a full manual run-through and confirm
every stage actually works, not just that it renders:

- [ ] Instructions screen shows, camera/mic checklist works, Start Test enables correctly
- [ ] Aptitude tab: questions render, answers can be selected, section/total timer counts down correctly, submitting works
- [ ] Coding tab: problem statement + code editor render, code can be written and run/submitted
- [ ] Tech Q&A tab: questions render, answers can be typed and submitted
- [ ] Tab switching during any of the 3 stages shows a warning and increments the violation counter
- [ ] Exiting fullscreen shows a warning and increments the violation counter
- [ ] 3rd violation ends the test and marks it disqualified
- [ ] After completing all 3 stages, the combined score email is sent to the candidate's email with the full Aptitude/Coding/Technical breakdown
- [ ] No blank screens, silent failures, or console errors occur anywhere in this flow

Report the result of this full run-through, including a screenshot of each
stage rendering correctly, once complete.