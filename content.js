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
            <p>End this chat?</p>
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
    document.getElementById('submitQuestionButton').addEventListener('click', writeAndSubmit);
    document.getElementById('maximizeBtn').addEventListener('click', maximizeChat);
    document.getElementById('question').addEventListener('keydown', function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault(); // Prevent the default behavior (inserting a newline)
            writeAndSubmit(); // Submit the form
          }
      });
    document.getElementById("loadingGif").src = chrome.runtime.getURL("images/chatbot-thinking-bg-removed.gif");
    document.getElementById("closeConfirm").addEventListener('click', endChat);
    document.getElementById("closeCancel").addEventListener('click', hideEndChat);
    

    const QAdiv = document.getElementById('QAdiv');
    const QAButtonContainer = document.getElementById('QAButtonContainer');
    const conversationDiv = document.getElementById("conversationDiv");
    const closingMessage = document.getElementById("closingMessage");

    let conversation = [];
    let isBigger = false;

    function toggleQAdiv(){
        //console.log('toggleQAdiv');
        if(QAdiv.style.display !== 'block'){
            QAdiv.style.display='block';
            setTimeout(() => {
                QAdiv.style.opacity = '1';
            }, 10);
            QAButtonContainer.style.visibility='hidden';
        }
        else{
            QAdiv.style.opacity = '0';
            setTimeout(() => {
                QAdiv.style.display = 'none';
            }, 500);
            QAButtonContainer.style.visibility='visible';
        }
    }

    function writeAndSubmit(){
        //console.log('writeAndSubmit');
    }

    function endChat(){
        //console.log('endChat');
        conversation = [];
        conversationDiv.innerHTML = '';
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

    function askQuestion(formattedConversation) {
        chrome.runtime.sendMessage(
          { action: "askQuestion", text: formattedConversation },
          (response) => {
            if (response && response.answer) {
            //console.log(response.answer);
              conversation.push(response.answer);
              let div = createMessageDiv(response.answer, "assistant");
              conversationDiv.appendChild(div);
              setTimeout(() => {
                div.style.opacity = "1";
              }, 10);
            //   appendLetterByLetter(
            //     div.getElementsByClassName("messageDiv").item(0),
            //     response.answer,
            //     0
            //   );
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

    function writeAndSubmit() {
        //get question text
        const newMessage = document.getElementById("question").value;
        conversation.push(newMessage);
        
      
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
        if (!conversationDiv.style.height) {
          setTimeout(() => {
            conversationDiv.style.height = "350px";
          }, 10);
          document.getElementById("closeChatBtn").style.display = "block";
        }
        conversationDiv.appendChild(div);
        setTimeout(() => {
          div.style.opacity = "1";
        }, 10);
        conversationDiv.scrollTop = conversationDiv.scrollHeight;
      
        // send question to backend and get response
        askQuestion(formatConversation(conversation));
    }

    function createMessageDiv(newMessage, role) {
        // const conversationDiv = document.getElementById('conversationDiv');
        const div = document.createElement("div");
        div.classList.add("messageContainerDiv");
        const messageDiv = document.createElement("div");
        const messageLogoDiv = document.createElement("div");
        messageDiv.classList.add("messageDiv");
        messageDiv.innerHTML = formatMessage(newMessage);
        //console.log(messageDiv.innerHTML);
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

    function appendLetterByLetter(messageDiv, response, index) {
        
        // if (index < response.length) {
        //   messageDiv.textContent += response.charAt(index); // Append current letter
        //   document.getElementById("conversationDiv").scrollTop =
        //     document.getElementById("conversationDiv").scrollHeight;
        //   setTimeout(() => appendLetterByLetter(messageDiv, response, index + 1), 10); // Wait 10ms then append next letter
        // } else {
        //   setTimeout(() => {
        //     document.getElementById("loadingGif").style.opacity = 0;
        //   }, 500);
        //   setTimeout(() => {
        //     document.getElementById("loadingGif").style.display = "none";
        //   }, 1000);
        // }
    }

    //toggleQAdiv() minimizeBtn QAButton
    //endChat() closeChatBtn
    //writeAndSubmit() submitQuestionButton

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

    function formatMessage(newMessage) {
        let formattedMessage = marked(newMessage);
        //console.log(formattedMessage);
        return formattedMessage;
    }

  }