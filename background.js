import { apiKey } from "./apiKey.js";
import { messages } from "./messages.js";

//var systemMessage = "You are an AI assistant that hellp people with learning disabilities. Therefore, your answer need to be clear and simple. Try to use clear and simple words. Break down the concept into smaller main points if needed.";
var language = "en";
var currentConversation = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.action === 'askQuestion'){
    const formattedConversation = formatConversation(request.text);
    // Call your OpenAI API function here or handle the text processing.
    askQuestion(formattedConversation).then((response) => {
      sendResponse({ answer: response });
  })}else if(request.action === 'changeLanguage'){
    language = request.language;
    chrome.contextMenus.update("breakdownText", {
      title: messages[language].breakdownText
    });
  }
  // else if(request.action === 'getLanguage'){
  //   sendResponse({ language: language });
  // }else if(request.action === 'getCurrentConversation'){
  //   sendResponse({ currentConversation: currentConversation });
  // }
  else if(request.action === 'getData'){
    sendResponse({ language: language, currentConversation: currentConversation });
  }
  else if(request.action === 'saveCurrentConversation'){
    currentConversation = request.conversation;
    console.log(currentConversation);
  }else if(request.action==='endConversation'){
    currentConversation = [];
    console.log(currentConversation);
  }
  return true;  // Required when using sendResponse asynchronously
});

async function askQuestion(formattedConversation) {

  let conversation = [
    { role: "system", content: messages[language].systemMessage },
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
      max_tokens: 1000
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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    console.log(messages[language].breakdownText);
    chrome.contextMenus.create({
      id: "breakdownText",
      title: messages[language].breakdownText,
      contexts: ["selection"], // The menu item appears when text is selected
      documentUrlPatterns: ["<all_urls>"] // Specify the URL patterns if needed
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "breakdownText") {

    // Example action: send the selected text to a content script
    chrome.tabs.sendMessage(tab.id, {
      action: "pushSelectedText",
      text: messages[language].breakdownText + " ```" + info.selectionText + " ```"
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getMessages') {
    sendResponse({ messages });
  }
});

function formatConversation(conversation) {
  var formattedConversation = [];
  for (var i = 0; i < conversation.length; i++) {
    if (i % 2 == 0) {
      formattedConversation.push({ role: "user", content: conversation[i] });
    } else {
      formattedConversation.push({
        role: "assistant",
        content: conversation[i],
      });
    }
  }
  return formattedConversation;
}