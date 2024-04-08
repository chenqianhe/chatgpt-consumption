import { getEncoding } from "js-tiktoken";

var enc = getEncoding("cl100k_base");

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "calToken") {
        const textList = request.textList;
        // 在这里处理接收到的文本内容
        const result = textList.map(text => enc.encode(text).length);
        // 将处理结果发送回内容脚本
        sendResponse({ tokenCountList: result });
    }
});
