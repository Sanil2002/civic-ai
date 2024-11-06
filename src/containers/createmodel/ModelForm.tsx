// import { useState } from "react"
import Button from "../../components/atom/button/Button"
import InputArea from "../../components/atom/inputarea/InputArea"
import Imagesvg from "../../components/atom/svg/Imagesvg"
import Plussvg from "../../components/atom/svg/Plussvg"

interface ModelFormProps {
  name: string,
  description: string,
  setName: React.Dispatch<React.SetStateAction<string>>,
  setDescription: React.Dispatch<React.SetStateAction<string>>
}

export const ModelForm:React.FC<ModelFormProps> = ({name,description,setDescription,setName}) => {

  return (
    <div className="flex w-full basis-1/4 flex-col items-end gap-[21px]">
      <div className="flex flex-col items-start gap-[12px] w-full">
        <h1 className="font-Nunito text-sm font-semibold w-full">Enter your details</h1>
        <div className="flex flex-row items-center justify-center gap-[8px] h-[3.125rem] w-full">
          <div className="w-full">
            <InputArea inputclassName="flex h-full w-full pr-[12px] items-center gap-[10px] flex-grow shrink-0 balance-0 rounded-[10px] border-[1px] border-gray-700"
            labelclassName="font-Nunito text-[16px] font-normal"
            label="Name your model"
            id="Name_your_model"
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text" />
            </div>
          <div className="flex h-full p-4 justify-center items-center gap-[10px] rounded-[10px] border-[1px] border-gray-700">
            <Imagesvg />
          </div>
        </div>
        <InputArea inputclassName="flex h-[80px] w-full p-[12px] items-start gap-[10px] rounded-[10px] border-[1px] border-gray-700"
          labelclassName="font-Nunito text-[16px] font-normal"
          label="Description"
          id="Description"
          onChange={(e) => setDescription(e.target.value)}
          value={description}
          type="text" />
      </div>

      <div className="flex flex-col items-start gap-[12px] w-full">
        <h1 className="font-Nunito text-md font-semibold">Sample Questions</h1>
        <div className="flex w-full basis-1/4 flex-col items-start gap-[12px]">
          <InputArea inputclassName="flex p-[12px] items-center gap-[10px] rounded-[10px] border-[1px] border-gray-700"
            labelclassName="font-Nunito text-md font-normal"
            label="Type your sample question"
            id="Type your sample question"
            onChange={() => { }}
            value={""}
            type="text" />
          <InputArea inputclassName="flex p-[12px] items-center gap-[10px] rounded-[10px] border-[1px] border-gray-700"
            labelclassName="font-Nunito text-md font-normal"
            label="Type your sample question"
            id="Type your sample question"
            onChange={() => { }}
            value={""}
            type="text" />
          <InputArea inputclassName="flex p-[12px] items-center gap-[10px] rounded-[10px] border-[1px] border-gray-700"
            labelclassName="font-Nunito text-md font-normal"
            label="Type your sample question"
            id="Type your sample question"
            onChange={() => { }}
            value={""}
            type="text" />
        </div>
      </div>

      <Button theme={"secondary"} className="flex group h-[44px] px-[16px] justify-center items-center gap-[8px] rounded-[10px] border-[1px] border-[#4D4DFF] hover:bg-[#8080FF]">
        <Plussvg />
        <h1 className="text-[#4D4DFF] group-hover:text-white font-Nunito text-md font-semibold">Add Question</h1>
      </Button>
    </div>
  )
}