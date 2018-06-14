import { ChatMessage } from "./chat-message";

export class ChatSystem {

    public static mainChatLog: Array<ChatMessage> = new Array<ChatMessage>();

    public static addChatMessage(newChatMessage: ChatMessage): void {

        this.mainChatLog.push(newChatMessage);

    }

}