import { Search } from "lucide-react"
import React, { useState, useEffect, useRef } from "react";
import { API_ROOT } from "../../../services/apiServices/apis/api";
import { useSelector } from "react-redux";
import { Skeleton } from "@mui/material";
import StopCircleIcon from '@mui/icons-material/StopCircle';
import Markdown from 'marked-react';
import ncs from '../../../assets/images/NetstratumLogo-Reound.png'
// import Skeleton from "../../atom/skeleton/skeleton";

interface Message {
    role: string;
    content: string;
}

export const ChatArea = () => {

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [done, setDone] = useState<boolean>(false);
    const chatBoxRef = useRef<HTMLDivElement | null>(null);
    const authToken = useSelector((state: any) => state.auth.authToken);
    // console.log("authToken", authToken);
    const token = useSelector((state: any) => state.auth.token);




    const handleSend = async () => {

        if (input.trim()) {
            const userMessage = { role: "user", content: input };
            const msg = [...messages, userMessage];
            setMessages(msg);
            setInput("");
            setIsLoading(true); // Start loading

            const Payload = {
                messages: msg,
                collections: []
            };

            const controller = new AbortController();
            setAbortController(controller);

            const response = await fetch(API_ROOT + "/privy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`

                },
                body: JSON.stringify(Payload),
                signal: controller.signal
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let text = "";
            const readStream = async () => {

                if (!reader) return;
                const { done, value } = await reader.read();
                setIsLoading(false)
                if (done) {
                    // setIsLoading(false); // Stop loading when the response is complete 
                    setAbortController(null)
                    setDone(true);
                    return;
                }
                let chunk = decoder.decode(value, { stream: true });
                chunk = chunk.slice(0, chunk.length - 1);
                text += chunk
                // const cleanedText = text.replace(/(\b\w)\s+(\w\b)/g, '$1$2');

                // // Step 2: Remove unnecessary line breaks.
                // const singleLineText = cleanedText.replace(/\n+/g, ' ');

                // // Step 3: Remove any extra spaces around punctuation.
                // const formattedText = singleLineText.replace(/\s+([.,])/g, '$1');

                // // Step 4: Remove spaces around hyphens in hyphenated words.
                // const fixedText = formattedText.replace(/\s*-\s*/g, '-');

                setMessages((prev) => {
                    if (prev[prev.length - 1].role !== "assistant") {
                        return [...prev, { role: "assistant", content: text }];
                    } else {
                        let updatedMessages = [...prev];
                        updatedMessages[updatedMessages.length - 1].content = text;
                        return updatedMessages;
                    }
                });
                // Continue reading the next chunk       
                readStream();
            };
            readStream();
        }
    };

    const stopStream = () => {
        if (abortController) {
            abortController.abort(); // Abort the ongoing request
            setIsLoading(false);
        }
        setAbortController(null)
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && abortController === null) {
            event.preventDefault();
            handleSend();
        }
    };

    const handleButtonClick = async (actionType: string) => {

        const lastAssistantMessage = messages
            .slice()
            .reverse()
            .find((msg) => msg.role === "assistant");

        // const messageToSend = `Summarize and give the response starting by, "Here is your Summerized text" : ${lastAssistantMessage?.content}`;
        let messageToSend;
        switch (actionType) {
            case 'summary':
                messageToSend = `You are a bot that summarizes a content. stream by sentance, make markdown text friendly. If you don't know the answer, just say that you don't know. don't brake the word, Use three sentance maximum and keep the answer consise.\n
    Here is the retrieved content: \n
    ${lastAssistantMessage?.content}`;
                break;
            case 'keynotes':
                messageToSend = `generate keynotes as list for the following: ${lastAssistantMessage?.content}`;
                break;
            case 'actions':
                messageToSend = `List actions starting by bold letters, "Here are your Actions": ${lastAssistantMessage?.content}`;
                break;
            default:
                return;
        }

        const userMessage = { role: "user", content: messageToSend };

        if (!lastAssistantMessage) return;

        setIsLoading(true);

        const Payload = {
            messages: [userMessage],
            collections: []
        }

        const response = await fetch(API_ROOT + "/privy", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            },
            body: JSON.stringify(Payload)
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let text = "";
        const readStream = async () => {

            if (!reader) return;
            const { done, value } = await reader.read();
            if (done) {
                setIsLoading(false); // Stop loading when the response is complete 
                // setAbortController(null)
                // setDone(true);
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: text.trim() } // Add new message after stream completion
                ]);
                return;
            }
            let chunk = decoder.decode(value, { stream: true });
            chunk = chunk.slice(0, chunk.length - 1);
            text += chunk
            // .slice(0, chunk.length - 1);
            // setMessages((prev) => [
            //     ...prev,
            //     { role: "assistant", content: text } // Add new message
            // ]);
            readStream();
        };
        readStream();
    }



    useEffect(() => {
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages, isLoading, input]);


    return (
        <div className="">
            <div className="flex flex-col py-4 items-center basis-1/4 w-full">
                <div className="xl:max-w-[78.75rem] w-full flex basis-1/4">
                    <div className="chat-container h-[calc(100vh-200px)] sm:h-[calc(100vh-280px)] overflow-y-auto lg:w-[100%]" ref={chatBoxRef}>
                        <div className="chat-box flex flex-col gap-4">
                            {messages.map((msg, index) => (
                                <div key={index} className={`flex flex-col gap-4 ${msg.role === "user" ? "justify-end " : "justify-end "}`}>
                                    <div className="flex flex-row gap-2">
                                        <div className={` ${msg.role === "user" ? 'bg-gradient-to-t from-[#003] to-[#003] w-[32px] h-[32px] rounded-[15px]' : "w-[32px] h-[32px] border-none"} text-white flex shrink-0 items-center justify-center border-white border-2`}>{msg.role === "user" ? token.name?.slice(0, 1) : <img src={ncs} />}</div>
                                        <div className="flex flex-col items-start gap-[8px]">
                                            <p className={`${msg.role === "user" ? "bg-white" : "bg-white "} text-[18px] font-normal font-Nunito rounded-lg p-4 lg:max-w-[756px]`}><Markdown>{msg.content}</Markdown></p>
                                            {(!isLoading && done && msg.role === "assistant") && <div className="flex items-center gap-[8px]">
                                                <button className="flex py-[6px] px-[12px] justify-center items-center gap-[10px] rounded-[50px] border-[1px] border-[rgba(255, 255, 255, 0.12)] bg-slate-200 text-black font-Nunito text-[12px] font-normal" onClick={() => handleButtonClick("summary")}>Summary</button>
                                                <button className="flex py-[6px] px-[12px] justify-center items-center gap-[10px] rounded-[50px] border-[1px] border-[rgba(255, 255, 255, 0.12)] bg-slate-200 text-black font-Nunito text-[12px] font-normal" onClick={() => handleButtonClick("keynotes")}>Key Notes</button>
                                                <button className="flex py-[6px] px-[12px] justify-center items-center gap-[10px] rounded-[50px] border-[1px] border-[rgba(255, 255, 255, 0.12)] bg-slate-200 text-black font-Nunito text-[12px] font-normal" onClick={() => handleButtonClick("actions")}>Actions</button>
                                            </div>}
                                        </div>
                                    </div>

                                </div>
                            ))}
                            {isLoading && (<div className="flex flex-row items-center gap-4 md:min-w-[460px] w-full">
                                <Skeleton className="rounded-full" variant="circular" width={32} height={32} />
                                <Skeleton height={44} className="rounded-lg lg:w-[956px] md:w-[456px] sm:w-full" />
                                {/* <Skeleton height="70px" width="md:40rem"/> */}

                            </div>)}
                        </div>
                    </div>
                </div>

                <div className="flex w-full sm:py-[30px] flex-col items-center justify-center gap-[10px] bottom-0">
                    <div className="flex xl:max-w-[78.75rem] w-full h-[80px] py-[18px] px-[24px] justify-end flex-col items-center gap-[10px] rounded-[10px] bg-white">
                        <div className="flex justify-between items-center flex-grow shrink-0 basis-0 bg-white h-full w-full">
                            <div className="flex w-full items-center gap-[12px]">
                                <div className="w-[32px] h-[32px] flex justify-center items-center gap-[10px] shrink-0 rounded-[10px] cursor-pointer">
                                    <Search />
                                </div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Search here"
                                    className="flex-grow rounded-[8px] font-Nunito text-[20px] text-black font-normal focus:outline-none overflow-scroll w-full" />
                            </div>
                            <button className="w-[44px] h-[44px] flex justify-center items-center cursor-pointer gap-[10px] rounded-[10px]"
                                onClick={handleSend}>
                                {abortController !== null ? <div onClick={stopStream} className="w-full h-full flex justify-center items-center"><StopCircleIcon fontSize="large" /></div> : <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <path d="M26.0204 21.8857L15.5149 3.51944C15.3627 3.24882 15.1412 3.02357 14.8731 2.86681C14.6051 2.71006 14.3002 2.62744 13.9897 2.62744C13.6792 2.62744 13.3743 2.71006 13.1062 2.86681C12.8382 3.02357 12.6167 3.24882 12.4644 3.51944L1.97647 21.8944C1.80258 22.2046 1.7273 22.5604 1.76064 22.9144C1.79399 23.2684 1.9344 23.6039 2.16315 23.8761C2.39191 24.1483 2.69817 24.3444 3.04115 24.4382C3.38413 24.5321 3.74756 24.5192 4.08304 24.4013L14.0001 21.049L23.9171 24.3991C24.1044 24.4651 24.3015 24.4991 24.5001 24.4998C24.8057 24.4987 25.1057 24.4177 25.3703 24.2647C25.6349 24.1117 25.8547 23.8921 26.0081 23.6277C26.1614 23.3633 26.2428 23.0634 26.2442 22.7577C26.2456 22.4521 26.1669 22.1515 26.016 21.8857H26.0204ZM24.4837 22.7432L14.8751 19.4969V13.1248C14.8751 12.8927 14.7829 12.6701 14.6188 12.506C14.4547 12.3419 14.2321 12.2498 14.0001 12.2498C13.768 12.2498 13.5454 12.3419 13.3814 12.506C13.2173 12.6701 13.1251 12.8927 13.1251 13.1248V19.4969L3.51757 22.7432L3.50007 22.7498L13.9848 4.37476L24.5001 22.7498L24.4837 22.7432Z" fill="black" />
                                </svg>}
                            </button>
                        </div>
                    </div>
                </div>
            </div >
        </div>
    )
}