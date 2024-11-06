import { ListMusic } from "lucide-react"
import TranslateCard from "../../atom/TranslateCard"
import { useRef, useState } from "react";
import { API_ROOT } from "../../../services/apiServices/apis/api";
import { useSelector } from "react-redux";
// import Closesvg from "../../atom/svg/Closesvg";
import Loader from "../../atom/Loader/Loader";
// import { Skeleton } from "@mui/material";
import Skelton from "../../atom/skeleton/skeleton.tsx"
import Notification from "../../atom/Notification";
import Markdown from 'marked-react';
import ncs from '../../../assets/images/NetstratumLogo-Reound.png'
// import { Skeleton } from "@mui/material";
// import LawExplainerCard from "../../atom/defaultcard/LawExplainerCard"

interface Message {
    role: string;
    content: string;
}

const Translate = () => {

    const [text, setText] = useState<string>("");
    const [audioFile, setAudioFile] = useState<null | string>(null);
    const [lang1, setLang1] = useState<string>("English")
    const [lang2, setLang2] = useState<string>("Spanish")
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState<string>("")
    const [loading, setLoading] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const authToken = useSelector((state: any) => state.auth.authToken);
    const token = useSelector((state: any) => state.auth.token);
    // const audioRef = useRef(null);

    const handleFileUpload = async (): Promise<void> => {
        const fileInput = fileInputRef.current;
        const file = fileInput?.files?.[0];

        if (!file) {
            alert("Please select a file.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true)
            const response = await fetch("http://134.195.41.162:8000/echo/stt", {
                method: "POST",
                body: formData,
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            // const resultDisplay = document.getElementById("result") as HTMLElement;
            let resultText = "";

            // Stream the result as chunks
            const readStream = async (): Promise<void> => {
                if (!reader) return;
                const { done, value } = await reader.read();
                if (done) {
                    setLoading(false)
                    handleSend(resultText)
                    console.log("Transcription complete")
                    return;
                }
                resultText += decoder.decode(value, { stream: true });
                setText(resultText);
                // Continue reading the next chunk
                await readStream();
            };
            await readStream();
        } catch (error) {
            console.error("Error uploading file:", error);
        }

    };



    const handleSend = async (userInput: string) => {

        if ((lang1 !== "" && lang1 !== "English") || (lang2 !== "" && lang2 !== "English")) {
            setIsLoading(true)
            const formattedtext = `Translate this text from ${lang1} to ${lang2}, maintaining meaning and tone, don't send anything extra or any other text, just send the translated text: ${userInput || text}`
            const userMessage = { role: "user", content: formattedtext };
            const msg = [...messages, userMessage];
            setMessages(msg);
            // setInput("");
            // setIsLoading(true); // Start loading

            const Payload = {
                messages: msg,
                collections: []
            };

            // const controller = new AbortController();
            // setAbortController(controller);

            const response = await fetch(API_ROOT + "/privy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authToken}`

                },
                body: JSON.stringify(Payload),
                // signal: controller.signal
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = "";
            const readStream = async () => {

                if (!reader) return;
                const { done, value } = await reader.read();
                setIsLoading(false)
                if (done) {
                    // setIsLoading(false); // Stop loading when the response is complete 
                    // setAbortController(null)
                    // setDone(true);
                    return;
                }
                let chunk = decoder.decode(value, { stream: true });
                accumulatedText += chunk.slice(0, chunk.length - 1);
                setMessages((prev) => {
                    if (prev[prev.length - 1].role !== "assistant") {
                        return [...prev, { role: "assistant", content: accumulatedText }];
                    } else {
                        let updatedMessages = [...prev];
                        updatedMessages[updatedMessages.length - 1].content = accumulatedText;
                        return updatedMessages;
                    }
                });
                setInput("")
                // Continue reading the next chunk       
                readStream();
            };
            readStream();
        } else {
            Notification("info", "Select the Languages", "warning");
        }
    };

    const handleButtonClick = async () => {                                       //for summarize, keynotes and actions

        const lastAssistantMessage = messages
            .slice()
            .reverse()
            .find((msg) => msg.role === "assistant");

        let messageToSend = `Summarize and give the response starting by bold letters in ${lang2}, "Here is your Summarized text": ${lastAssistantMessage?.content}`;
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
            setIsLoading(false);
            if (done) {
                // setIsLoading(false); // Stop loading when the response is complete 
                // setAbortController(null)
                // setDone(true);
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: text.trim() } // Add new message after stream completion
                ]);
                return;
            }
            let chunk = decoder.decode(value, { stream: true });
            text += chunk
            text = text.trimEnd().replace(/\s+/g, ' ');
            // .slice(0, chunk.length - 1);
            // setMessages((prev) => [
            //     ...prev,
            //     { role: "assistant", content: text } // Add new message
            // ]);
            readStream();
        };
        readStream();
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      try{
        const files = e.target.files;
        if (files && files[0]) {
            let url = URL.createObjectURL(files[0])
            setAudioFile(url);
            setText(""); // Clear previous transcription
            await handleFileUpload();
        }
    } catch(error) {
        Notification("Failed","Failed to upload File, Please try again later","danger");
        console.log("Error on file upload", error);
    }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSend(input);
        }
    };

    // console.log("translated messages", messages);


    return (<div className="w-full h-full overflow-hidden">
        <div className="grid grid-cols-10 md:grid-rows-7 items-center w-full h-full overflow-hidden">
            <div className="flex row-start-1 md:row-span-6 row-span-5 col-span-full xl:col-start-2 xl:col-span-8 w-full h-[calc(100vh-300px)] pb-2">


                <div className="chat-box flex flex-col gap-4 mt-4 overflow-auto lg:min-w-[656px] w-full">
                    {(text && !loading) && <div className="flex flex-row gap-4">
                        <div className={`bg-gradient-to-t from-[#003] to-[#003] w-[32px] h-[32px] rounded-[15px] text-white flex shrink-0 items-center justify-center`}>{token.name?.slice(0, 1)}</div>
                        <div className="flex flex-col text-lg font-normal font-Nunito rounded-lg p-4 gap-4 bg-white lg:max-w-[60%]">
                            {text}
                            <span className="flex justify-center italic text-sm w-full text-gray-700">Select the Languages for Translation and press Enter</span>
                        </div>
                    </div>}
                    {loading && <div className="flex flex-row gap-3">
                        <div className={`bg-gradient-to-t from-[#003] to-[#003] w-[32px] h-[32px] rounded-[15px] text-white flex shrink-0 items-center justify-center`}>{token.name?.slice(0, 1)}</div>
                        <div className="md:w-[456px] lg:w-[60%] w-full">
                            <Skelton shape="rectangle" text="Extracting....." height="100px" />
                        </div>
                    </div>}
                    {messages.map((msg, index) => (
                        <div key={index}>
                            <div className="flex flex-col items-start gap-[8px]">
                                {/* <span className={`${msg.role === "assistant" ? "bg-white" : "bg-gradient-to-t from-[#003] to-[#003] text-white "} text-[18px] font-normal font-Nunito rounded-lg p-4 w-fit`}>{msg.content}</span> */}
                                {(msg.role === "assistant") &&
                                    <div className="flex flex-row gap-4">
                                        <div className={`w-[32px] h-[32px] rounded-[15px] flex shrink-0 items-center justify-center`}><img src={ncs} /></div>
                                        <div className="flex flex-col gap-2 lg:max-w-[60%]">
                                            <span className="bg-white text-lg font-normal font-Nunito rounded-lg p-4 w-fit gap-2"><h1 className="font-bold font-Nunito text-lg flex flex-row">Your Translated text:</h1>{msg.content}</span>
                                            <div className="flex items-center gap-[8px]">
                                                <button className="flex py-[6px] px-[12px] justify-center items-center gap-[10px] rounded-[50px] border-[1px] border-slate-500 hover:bg-slate-200 text-black font-Nunito text-[12px] font-normal" onClick={handleButtonClick}>Summary</button>
                                            </div>
                                        </div>
                                    </div>}
                            </div>
                        </div>

                    ))}
                    {isLoading && <div className="flex flex-row gap-3">
                        <div className={`w-[32px] h-[32px] rounded-[15px] flex shrink-0 items-center justify-center`}><img src={ncs} /></div>
                        <div className="md:w-[456px] lg:w-[60%] w-full">
                            <Skelton shape="rectangle" text="Translating...." height="100px" />
                        </div>
                    </div>}
                </div>
            </div>

            <div className="xl:col-start-2 xl:col-span-8 md:row-span-1 row-start-7 col-span-full h-full flex md:flex-row flex-col justify-center items-center gap-[10px] pb-2">
                <div className="flex md:flex-row flex-col justify-center items-center gap-5 w-full">
                    {/* {audioFile && ( */}
                    {/* // <div className="flex md:flex-row items-center"> */}
                    {/* <audio controls src={audioFile} controlsList="nodownload" className="w-48 md:w-60" /> */}
                    {/* <audio ref={audioRef} src={URL.createObjectURL(audioFile)} style={{ display: 'none' }} /> */}
                    {/* <button className="bg-orange-300 hover:bg-orange-500 p-4 rounded-md md:w-24" onClick={handleFileUpload}>{!loading ? "Extract" : <Loader size="sm" />}</button> */}
                    {/* <div className="flex shrink-0 hover:bg-red-500" onClick={() => setAudioFile(null)}><Closesvg /></div> */}
                    {/* </div> */}
                    {/* // )} */}
                    <TranslateCard lang1={lang1} lang2={lang2} setLang1={setLang1} setLang2={setLang2} />
                </div>
            </div>


            <div className="flex flex-col items-center justify-end bottom-0 row-start-8 col-span-full xl:col-start-2 xl:col-span-8">
                <div className="flex min-h-[80px] max-h-full py-[18px] md:px-[24px] justify-end flex-col items-center gap-[10px] rounded-[10px] bg-white w-full">
                    <div className="flex justify-between items-center flex-grow shrink-0 basis-0 bg-white h-full w-full">
                        <div className="flex p-3 w-full items-center gap-[12px]">
                            {/* <div className="flex justify-center items-center gap-[10px] shrink-0 rounded-[10px] cursor-pointer hover:bg-gray-300 bg-gray-200">
                                <ListMusic className="shrink-0 w-[28px] h-[28px]" />
                            </div> */}
                            <div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    id="audioFile"
                                    className="hidden"
                                    accept="audio/*"
                                    // onChange={(e)=>setAudioFile(e.target.files[0])}
                                    onChange={handleFileChange}
                                />
                            </div>
                            <label
                                htmlFor="audioFile"
                                className="flex justify-center items-center gap-[10px] shrink-0 rounded-[10px] cursor-pointer  hover:bg-orange-300  bg-gray-200">
                                <div className="p-1"><ListMusic className="shrink-0 md:w-[28px] md:h-[28px]" /></div>
                            </label>
                            <input
                                type="text"
                                value={input}
                                placeholder="Upload Voice Here"
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setInput(e.target.value)}
                                className=" w-full flex-grow rounded-[8px] font-Nunito text-[20px] text-black font-normal focus:outline-none overflow-scroll"
                            />
                        </div>
                        <button onClick={() => handleSend(input)} className="flex shrink-0 justify-center items-center cursor-pointer gap-[10px] rounded-[10px]">
                            {/* hover:bg-[#3a3aff] bg-[#8080FF] */}

                            {/* <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <path d="M14 19.25C15.3919 19.2486 16.7265 18.695 17.7107 17.7107C18.695 16.7265 19.2486 15.3919 19.25 14V7C19.25 5.60761 18.6969 4.27226 17.7123 3.28769C16.7277 2.30312 15.3924 1.75 14 1.75C12.6076 1.75 11.2723 2.30312 10.2877 3.28769C9.30312 4.27226 8.75 5.60761 8.75 7V14C8.75145 15.3919 9.30504 16.7265 10.2893 17.7107C11.2735 18.695 12.6081 19.2486 14 19.25ZM10.5 7C10.5 6.07174 10.8687 5.1815 11.5251 4.52513C12.1815 3.86875 13.0717 3.5 14 3.5C14.9283 3.5 15.8185 3.86875 16.4749 4.52513C17.1313 5.1815 17.5 6.07174 17.5 7V14C17.5 14.9283 17.1313 15.8185 16.4749 16.4749C15.8185 17.1313 14.9283 17.5 14 17.5C13.0717 17.5 12.1815 17.1313 11.5251 16.4749C10.8687 15.8185 10.5 14.9283 10.5 14V7ZM14.875 22.7063V26.25C14.875 26.4821 14.7828 26.7046 14.6187 26.8687C14.4546 27.0328 14.2321 27.125 14 27.125C13.7679 27.125 13.5454 27.0328 13.3813 26.8687C13.2172 26.7046 13.125 26.4821 13.125 26.25V22.7063C10.9677 22.4867 8.96849 21.4751 7.51389 19.8669C6.05929 18.2588 5.25266 16.1684 5.25 14C5.25 13.7679 5.34219 13.5454 5.50628 13.3813C5.67038 13.2172 5.89294 13.125 6.125 13.125C6.35706 13.125 6.57962 13.2172 6.74372 13.3813C6.90781 13.5454 7 13.7679 7 14C7 15.8565 7.7375 17.637 9.05025 18.9497C10.363 20.2625 12.1435 21 14 21C15.8565 21 17.637 20.2625 18.9497 18.9497C20.2625 17.637 21 15.8565 21 14C21 13.7679 21.0922 13.5454 21.2563 13.3813C21.4204 13.2172 21.6429 13.125 21.875 13.125C22.1071 13.125 22.3296 13.2172 22.4937 13.3813C22.6578 13.5454 22.75 13.7679 22.75 14C22.7473 16.1684 21.9407 18.2588 20.4861 19.8669C19.0315 21.4751 17.0323 22.4867 14.875 22.7063Z" fill="white" />
                            </svg> */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
                                <path d="M26.0204 21.8857L15.5149 3.51944C15.3627 3.24882 15.1412 3.02357 14.8731 2.86681C14.6051 2.71006 14.3002 2.62744 13.9897 2.62744C13.6792 2.62744 13.3743 2.71006 13.1062 2.86681C12.8382 3.02357 12.6167 3.24882 12.4644 3.51944L1.97647 21.8944C1.80258 22.2046 1.7273 22.5604 1.76064 22.9144C1.79399 23.2684 1.9344 23.6039 2.16315 23.8761C2.39191 24.1483 2.69817 24.3444 3.04115 24.4382C3.38413 24.5321 3.74756 24.5192 4.08304 24.4013L14.0001 21.049L23.9171 24.3991C24.1044 24.4651 24.3015 24.4991 24.5001 24.4998C24.8057 24.4987 25.1057 24.4177 25.3703 24.2647C25.6349 24.1117 25.8547 23.8921 26.0081 23.6277C26.1614 23.3633 26.2428 23.0634 26.2442 22.7577C26.2456 22.4521 26.1669 22.1515 26.016 21.8857H26.0204ZM24.4837 22.7432L14.8751 19.4969V13.1248C14.8751 12.8927 14.7829 12.6701 14.6188 12.506C14.4547 12.3419 14.2321 12.2498 14.0001 12.2498C13.768 12.2498 13.5454 12.3419 13.3814 12.506C13.2173 12.6701 13.1251 12.8927 13.1251 13.1248V19.4969L3.51757 22.7432L3.50007 22.7498L13.9848 4.37476L24.5001 22.7498L24.4837 22.7432Z" fill="black" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div >
    </div>)
}

export default Translate