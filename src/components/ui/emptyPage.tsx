import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TextType from './ui/TextType';

function EmptyPage() {
  return (
      <div className="min-h-screen flex relative justify-center items-center">
          <div className="w-[52vw] md:w-[45vw] h-[8.5vh] rounded-xl outline-4  outline-offset-2 outline-dashed flex justify-center items-center">
              <Button className="bg-primary shadow-sm px-2.5 py-2 rounded-lg absolute right-[25vw] md:right-[30vw] top-[36vh] border-0">
                  <Plus />
              </Button>
              <h3 className="text-lg"><span className="bg-accent cursor-pointer rounded-md mx-1 pl-1">Sign in </span>
                  <TextType
                   text={["to add Capsule", "to create memories", "to have fun!"]}
                   typingSpeed={50}
                   pauseDuration={1500}
                      cursorCharacter="▎"
              /></h3>
          </div>    
      </div>
  )
}

export default EmptyPage