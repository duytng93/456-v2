// Dynamically inject Bootstrap from CDN
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdn.jsdelivr.net/npm/bootstrap@4.4.1/dist/css/bootstrap.min.css';
document.head.appendChild(link);

const link2 = document.createElement('link');
link2.rel = 'stylesheet';
link2.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
document.head.appendChild(link2);

if (!document.getElementById('ai-chat-box')) {
    let chatBox = document.createElement('div');
    chatBox.id = 'ai-chat-box';
    chatBox.innerHTML = `
      <div id="QAButtonContainer">
            <button class="btn btn-primary" id="QAButton">Need help? <i class="fa fa-commenting-o fa-rotate-270"></i></button>
      </div>
      <div id="QAdiv" class="border border-primary">
        <div id="QAdiv-header" class="bg-primary">
            Chat with AI:
        </div>
        <button class="close-button text-white" id="closeChatBtn">&#128473;</button>
        <button class="minimize-button text-white" id="minimizeBtn">&#128469;</button>
        <button class="maximize-button text-white" id="maximizeBtn">&#x1F5D7;</button>
        <div id="closingMessage" class="border-primary">
            <p id="closingMessageHeader">End this chat?</p>
            <button class="btn btn-primary" id="closeConfirm">Yes</button>
            <button class="btn btn-secondary" id="closeCancel">No</button>
        </div>
        <img id="loadingGif" alt="Loading..." width="120px" height="120px"/>
        <div id="conversationDiv">
        </div>
        <div class="row align-items-end" style="padding: 10px 20px 10px 20px">
            <div class="col-10">
                <textarea class="form-control" id="question" rows="3" placeholder="Enter your question:"></textarea>
            </div>
            <div class="col-2 text-center">
                <button class="btn btn-primary" type="button" id="submitQuestionButton"><i class="fa fa-paper-plane"></i></button>
            </div>
        </div>
        <div class="mb-3 text-center">
            <p id="select-language-pan" class="d-inline">Select your language:</p>
            <select id="language-select" class="form-select form-select-sm" aria-label=".form-select-sm example" style="width: 32%; max-width:200px">
                <option value="en">English (default)</option>
                <option value="es">Spanish</option>
                <option value="vi">Vietnamese</option>
            </select>
        </div>
      </div>
    `;
  
    document.body.appendChild(chatBox);

    document.getElementById('QAButton').addEventListener('click', toggleQAdiv);
    document.getElementById('closeChatBtn').addEventListener('click', showEndChat);
    document.getElementById('minimizeBtn').addEventListener('click', toggleQAdiv);
    document.getElementById('submitQuestionButton').addEventListener('click', displayAndSubmit);
    document.getElementById('maximizeBtn').addEventListener('click', maximizeChat);
    document.getElementById('question').addEventListener('keydown', function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent the default behavior (inserting a newline)
            //get question text
            conversation.push(question.value);
            displayAndSubmit(question.value); // Submit the form
          }
      });
    document.getElementById("loadingGif").src = chrome.runtime.getURL("images/chatbot-thinking-bg-removed.gif");
    document.getElementById("closeConfirm").addEventListener('click', endChat);
    document.getElementById("closeCancel").addEventListener('click', hideEndChat);
    document.getElementById("language-select").addEventListener('change', function(){
      currentLanguage = this.value;
      chrome.runtime.sendMessage({ action: "changeLanguage", language: this.value });
      updateTextLanguage();
    });
    
    const QAdiv = document.getElementById('QAdiv');
    const QAButton = document.getElementById('QAButton');
    const QAdivHeader = document.getElementById('QAdiv-header');
    const closingMessageHeader = document.getElementById('closingMessageHeader');
    const selectLanguagePan = document.getElementById('select-language-pan');
    const QAButtonContainer = document.getElementById('QAButtonContainer');
    const conversationDiv = document.getElementById("conversationDiv");
    const closingMessage = document.getElementById("closingMessage");
    const question = document.getElementById("question");
    let currentLanguage = "en";

    let conversation = [];
    let isBigger = false;
    let messages ={};
    let textNodeData = [];

    chrome.runtime.sendMessage({ action: 'getMessages' }, (response) => {
      if (response && response.messages) {
        messages = response.messages;
        getData();
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "pushSelectedText") {
        const selectedText = message.text;
        if(QAdiv.style.display !== 'block'){
          toggleQAdiv();
        }
        conversation.push(selectedText);
        displayAndSubmit(shortenString(selectedText, 70));
        
      }
    });
    

    function toggleQAdiv(){
        //console.log('toggleQAdiv');
        if(QAdiv.style.display !== 'block'){
            if (conversation.length > 0) { 
              QAButton.innerHTML = messages[currentLanguage].continueChat + ' <i class="fa fa-commenting-o fa-rotate-270"></i>'; 
              conversationDiv.style.display = "block";
              setTimeout(() => {
                conversationDiv.style.height = "350px";
              }, 10);
            }
            else QAButton.innerHTML = messages[currentLanguage].needHelpButton + ' <i class="fa fa-commenting-o fa-rotate-270"></i>';
            QAdiv.style.display='block';
            setTimeout(() => {
                QAdiv.style.opacity = '1';
            }, 10);
            QAButtonContainer.style.visibility='hidden';
        }
        else{
          if(conversation.length > 0){
            QAButton.innerHTML = messages[currentLanguage].continueChat + ' <i class="fa fa-commenting-o fa-rotate-270"></i>';
            setTimeout(() => {
              conversationDiv.style.height = "0px";
            }, 10);
          }
          else QAButton.innerHTML = messages[currentLanguage].needHelpButton + ' <i class="fa fa-commenting-o fa-rotate-270"></i>';
            QAdiv.style.opacity = '0';
            setTimeout(() => {
                QAdiv.style.display = 'none';
            }, 500);
            QAButtonContainer.style.visibility='visible';
        }
    }

    function endChat(){
        //console.log('endChat');
        conversation = [];
        conversationDiv.innerHTML = '';
        endConversation();
        toggleQAdiv();
        setTimeout(() => {
          conversationDiv.style.height = "0px";
        }, 10);
        hideEndChat();
    }

    function showEndChat(){
      if(conversation.length > 0){
        document.getElementById("closingMessage").style.display = 'block'
        setTimeout(() => {
            document.getElementById('closingMessage').style.opacity = 1;
        }, 10);
      }else toggleQAdiv();
  }

    function hideEndChat(){
        document.getElementById('closingMessage').style.opacity = 0;
        setTimeout(() => {
            document.getElementById('closingMessage').style.display = 'none';
        }, 10);
    }

    function maximizeChat(){
        //console.log('maximizeChat');
        if(isBigger){
            QAdiv.style.width = '30%';
            isBigger = false;
        }else{
            QAdiv.style.width = '60%';
            isBigger = true;
        }
    }

    function askQuestion(unformattedConversation) {
        chrome.runtime.sendMessage(
          { action: "askQuestion", text: unformattedConversation },
          (response) => {
            if (response && response.answer) {
            //console.log(response.answer);
              conversation.push(response.answer);
              saveCurrentConversation();
              let div = createMessageDiv(response.answer, "assistant");
              conversationDiv.appendChild(div);
              traverse(div,getText=false,writeText=true);
              setTimeout(() => {
                div.style.opacity = "1";
              }, 10);
            
            setTimeout(() => {
                document.getElementById("loadingGif").style.opacity = 0;
              }, 500);
              setTimeout(() => {
                document.getElementById("loadingGif").style.display = "none";
              }, 1000);
            }
          }
        );
    }

    function displayAndSubmit(newMessage) {
      
        // show loading animation
        conversationDiv.style.display = "block";
        document.getElementById("loadingGif").style.display = "block";
        setTimeout(() => {
          document.getElementById("loadingGif").style.opacity = "1";
        }, 10);
      
        //reset question text
        document.getElementById("question").value = "";
      
        //create message div and append to conversation div
        const div = createMessageDiv(newMessage, "user");
        if (!conversationDiv.style.height || conversationDiv.style.height === "0px") {  
          setTimeout(() => {
            conversationDiv.style.height = "350px";
          }, 10);
        }
        conversationDiv.appendChild(div);
        setTimeout(() => {
          div.style.opacity = "1";
        }, 10);
        conversationDiv.scrollTop = conversationDiv.scrollHeight;
      
        // send question to backend and get response
        askQuestion(conversation);
        
    }

    function createMessageDiv(newMessage, role) {
        // const conversationDiv = document.getElementById('conversationDiv');
        const div = document.createElement("div");
        div.classList.add("messageContainerDiv");
        const messageDiv = document.createElement("div");
        const messageLogoDiv = document.createElement("div");
        messageDiv.classList.add("messageDiv");
        messageDiv.innerHTML = formatMessage(newMessage);

        // const strongTags = messageDiv.querySelectorAll('strong');
        // if(strongTags.length > 0){
        //   strongTags.forEach((tag) => {
        //     //console.log(tag.textContent);
        //     let textData = tag.textContent;
        //     tag.textContent = "";
        //     appendLetterByLetter(tag, textData, 0);
        //     let textAfter = tag.nextSibling;
        //     if(textAfter && textAfter.nodeType === Node.TEXT_NODE){
        //       //console.log(textAfter.textContent);
        //       textAfter.textContent += " ..modified"; 
        //     }
        //   })
        // }
        if(role === "assistant"){
          traverse(messageDiv,getText=true,writeText=false);
        }
        // console.log("******************");
        // console.log(messageDiv.innerHTML);
        console.log("===================");
        const img = document.createElement("img");
        img.style.width = "30px"; // Example width
        img.style.height = "30px"; // Example height
        messageLogoDiv.classList.add("messageLogoDiv");
        if (role === "user") {
          img.src = chrome.runtime.getURL("images/user-icon.png");;
          messageLogoDiv.appendChild(img);
          div.appendChild(messageLogoDiv);
          div.appendChild(messageDiv);
        } else {
          img.src = chrome.runtime.getURL("images/open-ai-logo.png");
          messageLogoDiv.appendChild(img);
          div.appendChild(messageDiv);
          div.appendChild(messageLogoDiv);
        }
      
        div.style.marginBottom = "10px";
        return div;
    }

    

    function formatMessage(newMessage) {
        let formattedMessage = marked(newMessage);
        //console.log(formattedMessage);
        return formattedMessage;
    }

    function shortenString(str, maxLength) {
      if (str.length > maxLength) {
          return str.substring(0, maxLength) + '...';
      }
      return str;
    }

    function getData(){
      chrome.runtime.sendMessage({ action: "getData" }, (response) => {
        if(response && response.language){
          currentLanguage = response.language;
          document.getElementById("language-select").value = currentLanguage;
          updateTextLanguage();
        }
        if(response && response.currentConversation.length>0){
            console.log(response.currentConversation);
            QAButton.innerHTML = messages[currentLanguage].continueChat + ' <i class="fa fa-commenting-o fa-rotate-270"></i>';
            conversation = response.currentConversation;
            // setTimeout(() => {
            //   conversationDiv.style.height = "350px";
            // }, 10);
            for (let i = 0; i < conversation.length; i++) {
              if (i % 2 == 0) {
                let div = createMessageDiv(conversation[i], "user");
                conversationDiv.appendChild(div);
                setTimeout(() => {
                  div.style.opacity = "1";
                }, 10);
              }else{
                let div = createMessageDiv(conversation[i], "assistant");
                conversationDiv.appendChild(div);
                setTimeout(() => {
                  div.style.opacity = "1";
                }, 10);
              }
            }
            conversationDiv.scrollTop = conversationDiv.scrollHeight;
        }
      })
    }

    // function getLanguageAndUpdateText(){
    //     chrome.runtime.sendMessage({ action: "getLanguage" }, (response) => {
    //         if (response && response.language) {
    //           currentLanguage = response.language;
    //           document.getElementById("language-select").value = currentLanguage
    //           updateTextLanguage();
    //         }
    //       });
    // }

    function setLanguage(){
        chrome.runtime.sendMessage({ action: "changeLanguage", language: currentLanguage });
    }

    // function getCurrentConversationAndDisplay(){
    //     chrome.runtime.sendMessage({ action: "getCurrentConversation" }, (response) => {
    //       if (response && response.currentConversation.length) {
    //         console.log(response.currentConversation);
    //         QAButton.innerHTML = messages[currentLanguage].continueChat + ' <i class="fa fa-commenting-o fa-rotate-270"></i>';
    //         conversation = response.currentConversation;
    //         setTimeout(() => {
    //           conversationDiv.style.height = "350px";
    //         }, 10);
    //         for (let i = 0; i < conversation.length; i++) {
    //           if (i % 2 == 0) {
    //             let div = createMessageDiv(conversation[i], "user");
    //             conversationDiv.appendChild(div);
    //             setTimeout(() => {
    //               div.style.opacity = "1";
    //             }, 10);
    //           }else{
    //             let div = createMessageDiv(conversation[i], "assistant");
    //             conversationDiv.appendChild(div);
    //             setTimeout(() => {
    //               div.style.opacity = "1";
    //             }, 10);
    //           }
    //         }
    //         conversationDiv.scrollTop = conversationDiv.scrollHeight;
    //       }
    //     });
    // }

    function saveCurrentConversation(){
        chrome.runtime.sendMessage({ action: "saveCurrentConversation", conversation: conversation });
    }

    function endConversation(){
      chrome.runtime.sendMessage({ action: "endConversation" });
    }

    function updateTextLanguage(){
      //console.log(messages);
        QAButton.innerHTML = messages[currentLanguage].needHelpButton + ' <i class="fa fa-commenting-o fa-rotate-270"></i>';
        QAdivHeader.textContent = messages[currentLanguage].header;
        selectLanguagePan.textContent = messages[currentLanguage].selectLanguage;
        closingMessageHeader.textContent = messages[currentLanguage].endChat;
        question.placeholder = messages[currentLanguage].enterQuestion;
        selectLanguagePan.textContent = messages[currentLanguage].selectLanguage;
    }

    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function appendLetterByLetter(element, content, index) {

      while (index < content.length) {
        element.textContent += content.charAt(index);
        index++;
        await sleep(10);
      }
      
    }

    async function traverse(node,getText,writeText){
        if(node.nodeType === Node.TEXT_NODE){
          if(getText){
            textNodeData.push(node.textContent);
            node.textContent = "";
          }else if(writeText){
            let textData = textNodeData.shift();
            await appendLetterByLetter(node, textData, 0);
            document.getElementById("conversationDiv").scrollTop = document.getElementById("conversationDiv").scrollHeight;
          }
          
        }else{
          for (let child of node.childNodes) {
            await traverse(child,getText,writeText);
          }
        }
    }


  }