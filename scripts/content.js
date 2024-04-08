// 检查 DOM 是否已加载
if (document.readyState === 'complete' || document.readyState !== 'loading') {
    injectCustomElement();
} else {
    document.addEventListener('DOMContentLoaded', injectCustomElement);
}

var shownContainer;
var currentURL;

new MutationObserver(() => {
    if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        if (currentURL.startsWith('https://chat.openai.com/')) {
            if (document.readyState === 'complete' || document.readyState !== 'loading') {
                injectCustomElement();
            } else {
                document.addEventListener('DOMContentLoaded', injectCustomElement);
            }
        }
    }
}).observe(document, { subtree: true, childList: true })

function getAllText() {
    return Array.from(document.querySelectorAll('div[data-message-id]')).map(div => div.innerText);
}

function updateCount() {
    const textList = getAllText();
    if (textList.length === 0) {
        updateContent([]);
        return;
    }

    // 发送获取到的文本内容到背景脚本或弹出窗口
    chrome.runtime.sendMessage({action: "calToken", textList: textList}, function(response) {
        // 在这里处理接收到的处理结果
        const tokenCountList = response.tokenCountList;
        // 更新内容
        updateContent(tokenCountList);
    });
}

async function injectCustomElement() {
    console.log("Injecting custom element");
    await new Promise(r => setTimeout(r, 1000));
    if (document.getElementById('chatgpt-consumption')) {
        return;
    }

    // 假设您要查找的元素的 ID 是 'targetElementId'
    var targetElement = document.getElementById('prompt-textarea');

    if (!targetElement) {
        console.error("Target element not found");
        return;
    }

    // 获取目标元素的父元素
    var parentElement = targetElement.parentNode;

    // 创建一个新的 div 元素
    let newDiv = document.createElement('div');
    newDiv.className = 'px-5 py-5 flex flex-row items-center gap-3 font-mono italic';
    newDiv.id = 'chatgpt-consumption';

    // 将新的 div 插入为父元素的第一个子元素
    parentElement.insertBefore(newDiv, parentElement.firstChild);

    shownContainer = newDiv;

    shownContainer.innerHTML = `
<div>
    <span class="text-sm">Window tokens: </span>
    <span class="text-lg">0</span>
</div>
<div>
    <span class="text-sm">Token consumed: </span>
    <span class="text-lg">0</span>
</div>
<div class="flex flex-row items-center">
    <span class="text-sm">Water consumed: </span>
    <div class="flex flex-row items-center">
       <img class="w-8 h-8" style="transform: rotate(6deg)" src="https://s00.store01.dev/mineral-water.png" alt="Bottles of water" />
       <span class="text-lg text-blue-600">0</span>
    </div>
</div>`;

    updateCount();

    // 创建一个观察器
    var mainElement = document.querySelector("main");
    if (mainElement) {
        new MutationObserver(updateCount).observe(mainElement.children[1].children[0],
            {childList: true, characterData: true, subtree: true}
        );
    } else {
        console.error("Main element not found");
    }
}

function updateContent(tokenCountList) {
    if (!shownContainer) {
        return;
    }
    var totalToken = tokenCountList.reduce((a, b) => a + b, 0)
    var consumptionToken = 0;
    var round = Math.ceil(tokenCountList.length / 2);
    for (var i = 0; i < round; i++) {
        consumptionToken += tokenCountList[2*i] * (round - i);
        if (2*i+1 < tokenCountList.length) {
            consumptionToken += tokenCountList[2*i+1] * (round - i);
        }
    }
    var waterCount = Math.ceil(consumptionToken / 3000);
    shownContainer.children[0].children[1].innerText = totalToken;
    shownContainer.children[1].children[1].innerText = consumptionToken;
    shownContainer.children[2].children[1].children[1].innerText = waterCount;
}
