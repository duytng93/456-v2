import { apiKey } from "./apiKey.js";
var systemMessage = "You are an AI assistant that hellp people with learning disabilities. Therefore, your answer need to be clear and simple. Try to use clear and simple words. Break down the concept into smaller main points if needed.";
var firstUserMessage = "Please breakdown this text for easy understanding: ";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.action === 'askQuestion'){
    const formattedConversation = request.text;
    // Call your OpenAI API function here or handle the text processing.
    askQuestion(formattedConversation).then((response) => {
      sendResponse({ answer: response });
  })}
  return true;  // Required when using sendResponse asynchronously
});

async function askQuestion(formattedConversation) {

  let conversation = [
    { role: "system", content: systemMessage },
  ]

  conversation = conversation.concat(formattedConversation);
  
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",  // Or gpt-4 if available
      messages: conversation,
      max_tokens: 500
    })
  });

  const data = await response.json();
  
  if (response.ok) {
    return data.choices[0].message.content;
  } else {
    console.error("API Error:", data);
    throw new Error("Failed to simplify text");
  }
}

chrome.contextMenus.create({
  id: "breakdownText",
  title: "Break it down for me",
  contexts: ["selection"], // The menu item appears when text is selected
  documentUrlPatterns: ["<all_urls>"] // Specify the URL patterns if needed
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "breakdownText") {

    // Example action: send the selected text to a content script
    chrome.tabs.sendMessage(tab.id, {
      action: "pushSelectedText",
      text: "Break it down for me: ```" + info.selectionText + "```"
    });
  }
});