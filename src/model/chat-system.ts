import { ChatMessage } from "./chat-message";

export class ChatSystem {

    public static mainChatLog: Array<ChatMessage> = new Array<ChatMessage>();
    private static maxChatLength: number = 30;

    public static addChatMessage(newChatMessage: ChatMessage): void {

        if (this.mainChatLog.length >= this.maxChatLength) {
            this.mainChatLog.splice(0, 1);
        }

        this.mainChatLog.push(newChatMessage);
    }

}