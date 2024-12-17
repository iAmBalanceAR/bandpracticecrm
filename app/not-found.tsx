import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center bp-4">
      <div className="flex flex-col-reverse md:flex-row items-center gap-8">
        <div className="flex-1 animate-in slide-in-from-left duration-500">
          <img 
            className="w-full h-screen mx-auto" 
            src="/images/404-error-robot.svg" 
            alt="404 Error Illustration" 
          />
        </div>
        <div className="flex-1 text-center md:text-left animate-in fade-in slide-in-from-right duration-500">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 text-nowrap">
            Page Not Found
          </h1>
          <div className="w-16 h-1 bg-primary my-4 md:my-6 mx-auto md:mx-0" />
          <p className="text-lg text-gray-400 mb-8">
            err:PageNotFound_010PNF236
          </p>
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            <Link href="/auth/signin">
              <Button 
                className="w-full md:w-auto bg-primary hover:bg-primary/90 text-white transition-all hover:scale-105"
                size="lg"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/" className="block md:inline-block mt-4 md:mt-0 md:ml-4">
              <Button 
                variant="outline"
                className="w-full md:w-auto transition-all hover:scale-105"
                size="lg"
              >
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}