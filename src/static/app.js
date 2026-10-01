document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let messageTimeoutId;

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    clearTimeout(messageTimeoutId);
    messageTimeoutId = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function createParticipantList(activityName, participants) {
    if (!participants || !participants.length) {
      const emptyState = document.createElement("p");
      emptyState.className = "no-participants";
      emptyState.textContent = "No participants yet.";
      return emptyState;
    }

    const participantList = document.createElement("ul");
    participantList.className = "participants-list";

    participants.forEach((participant) => {
      const participantItem = document.createElement("li");
      participantItem.className = "participant-item";

      const participantEmail = document.createElement("span");
      participantEmail.className = "participant-email";
      participantEmail.textContent = participant;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "participant-remove-button";
      removeButton.dataset.activity = activityName;
      removeButton.dataset.email = participant;
      removeButton.setAttribute("aria-label", `Remove ${participant} from ${activityName}`);
      removeButton.title = "Unregister participant";
      removeButton.textContent = "🗑";

      participantItem.appendChild(participantEmail);
      participantItem.appendChild(removeButton);
      participantList.appendChild(participantItem);
    });

    return participantList;
  }

  function createActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const activityHeader = document.createElement("div");
    activityHeader.className = "activity-header";

    const title = document.createElement("h4");
    title.textContent = name;

    const spotsLeft = details.max_participants - details.participants.length;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `${spotsLeft} spots left`;

    activityHeader.appendChild(title);
    activityHeader.appendChild(badge);

    const description = document.createElement("p");
    description.className = "description";
    description.textContent = details.description;

    const schedule = document.createElement("p");
    const scheduleLabel = document.createElement("strong");
    scheduleLabel.textContent = "Schedule: ";
    schedule.appendChild(scheduleLabel);
    schedule.append(details.schedule);

    const participantsSection = document.createElement("div");
    participantsSection.className = "participants-section";

    const participantsHeading = document.createElement("strong");
    participantsHeading.className = "participants-heading";
    participantsHeading.textContent = "Participants";

    participantsSection.appendChild(participantsHeading);
    participantsSection.appendChild(createParticipantList(name, details.participants));

    activityCard.appendChild(activityHeader);
    activityCard.appendChild(description);
    activityCard.appendChild(schedule);
    activityCard.appendChild(participantsSection);

    return activityCard;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch(`/activities?ts=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch activities: ${response.status}`);
      }

      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        activitiesList.appendChild(createActivityCard(name, details));

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const removeButton = event.target.closest(".participant-remove-button");

    if (!removeButton) {
      return;
    }

    const { activity, email } = removeButton.dataset;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Unable to unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
