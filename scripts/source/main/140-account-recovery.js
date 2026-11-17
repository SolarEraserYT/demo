/* ==========================================
   SOLARERASER — PERMANENT RECOVERY CODE
   Step 4: /recover_code
   ========================================== */

(() => {
  "use strict";

  const previousHandleCommand = handleCommand;
  let recoveryRequestRunning = false;

  handleCommand = async function(content) {
    if (!/^\/recover_code\s*$/i.test(content)) {
      return previousHandleCommand(content);
    }

    if (recoveryRequestRunning) {
      privateWarning(
        "Recovery code request already in progress."
      );
      return;
    }

    if (!supabase || !profile) {
      privateWarning("Connect to chat first.");
      return;
    }

    recoveryRequestRunning = true;

    try {
      const { data, error } = await supabase.rpc(
        "issue_chat_recovery_code"
      );

      if (error) throw error;

      
      if (data === "ALREADY_ISSUED") {
        // Older recovery codes were stored as hashes only.
        // Register the saved code once to enable viewing it again.

        const panel = document.createElement("div");
        panel.className = "message_item solar-private-notice";

        panel.style.cssText = `
          padding: 12px;
          margin: 8px 0;
          border: 1px solid #5cbe92;
          border-radius: 8px;
          background: #10251c;
          color: #d6ffe5;
          font-size: 12px;
        `;

        const title = document.createElement("strong");
        title.textContent = "🔐 Link your existing recovery code";

        const explanation = document.createElement("p");
        explanation.textContent =
          "Your recovery code was created before repeat viewing " +
          "was added. Enter your saved code once to enable viewing " +
          "it whenever you use /recover_code. Your code won't change.";

        const input = document.createElement("input");
        input.type = "password";
        input.placeholder = "Your existing 48-character code";
        input.autocomplete = "off";
        input.spellcheck = false;
        input.maxLength = 48;

        input.style.cssText = `
          box-sizing: border-box;
          display: block;
          width: 100%;
          padding: 9px;
          margin: 10px 0;
          background: #091810;
          border: 1px solid #5cbe92;
          border-radius: 6px;
          color: white;
          font-family: monospace;
        `;

        const button = document.createElement("button");
        button.type = "button";
        button.textContent = "Save for Repeat Viewing";

        button.style.cssText = `
          padding: 8px 12px;
          background: #194b32;
          color: white;
          border: 1px solid #5cbe92;
          border-radius: 6px;
          cursor: pointer;
        `;

        const status = document.createElement("p");
        status.style.cssText = `
          margin: 8px 0 0;
          color: #b2ddc0;
          font-size: 11px;
        `;

        button.addEventListener("click", async () => {
          const savedCode = input.value.trim().toLowerCase();

          if (!/^[0-9a-f]{48}$/.test(savedCode)) {
            status.textContent =
              "Enter your original 48-character recovery code.";
            return;
          }

          input.disabled = true;
          button.disabled = true;
          status.textContent = "Verifying your code...";

          try {
            const { data: registered, error } =
              await supabase.rpc(
                "register_my_chat_recovery_code",
                { p_code: savedCode }
              );

            if (error) throw error;

            if (registered !== true) {
              throw new Error("Registration unsuccessful");
            }

            input.value = "";
            panel.remove();

            // Show the saved code using the normal command.
            await handleCommand("/recover_code");

          } catch (error) {
            input.value = "";
            input.disabled = false;
            button.disabled = false;

            status.textContent =
              "Could not register that code. " +
              "Check your saved code and try again.";
          }
        });

        panel.append(
          title,
          explanation,
          input,
          button,
          status
        );

        messages.appendChild(panel);
        messages.scrollTop = messages.scrollHeight;
        return;
      }


      if (
        typeof data !== "string" ||
        !/^[0-9a-f]{48}$/.test(data)
      ) {
        throw new Error(
          "Unexpected response from recovery system."
        );
      }

      // This message exists ONLY in your browser.
      // Nothing is sent to the public chat.
      const notice = document.createElement("div");
      notice.className =
        "message_item solar-private-notice";

      notice.style.cssText = `
        padding: 12px;
        margin: 8px 0;
        border: 1px solid #5cbe92;
        border-radius: 8px;
        background: #10251c;
        color: #d6ffe5;
        font-size: 12px;
      `;

      const heading = document.createElement("strong");
      heading.textContent =
        "🔐 Your permanent recovery code";

      const code = document.createElement("div");
      code.textContent = data;
      code.style.cssText = `
        margin: 10px 0;
        padding: 8px;
        border-radius: 5px;
        background: #091810;
        color: #ffffff;
        font-family: monospace;
        overflow-wrap: anywhere;
        user-select: all;
      `;

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copy Recovery Code";

      copy.style.cssText = `
        padding: 7px 12px;
        border-radius: 6px;
        border: 1px solid #5cbe92;
        background: #194b32;
        color: white;
        cursor: pointer;
      `;

      copy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(
            code.textContent
          );

          copy.textContent = "Copied ✓";
        } catch {
          copy.textContent =
            "Select the code above to copy";
        }
      });

      const warning = document.createElement("p");
      
      warning.textContent =
        "Keep this recovery code private. " +
        "Anyone with it could recover your account. " +
        "You can view it again anytime using /recover_code.";


      warning.style.cssText = `
        margin: 10px 0 0;
        color: #b2ddc0;
        font-size: 11px;
      `;

      notice.append(
        heading,
        code,
        copy,
        warning
      );

      messages.appendChild(notice);
      messages.scrollTop = messages.scrollHeight;

    } catch (error) {
      console.warn(
        "[Recovery Code] Request failed."
      );

      privateWarning(
        "Could not get recovery code: " +
        (error.message || "Unknown error")
      );

    } finally {
      recoveryRequestRunning = false;
    }
  };

  console.log(
    "[SolarEraser] /recover_code loaded."
  );
})();

