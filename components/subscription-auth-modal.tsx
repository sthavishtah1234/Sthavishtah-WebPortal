"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Users, User, Sparkles } from "lucide-react"

interface SubscriptionAuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAuthChoice: (choice: "login" | "register") => void
}

export function SubscriptionAuthModal({ open, onOpenChange, onAuthChoice }: SubscriptionAuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-full p-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">Welcome to Your Journey</DialogTitle>
          <DialogDescription className="text-center pt-2">
            To subscribe to this plan, please choose an option below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <Button
            onClick={() => onAuthChoice("register")}
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <Users className="mr-2 h-5 w-5" />
            Join Our Community
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500">Already have an account?</span>
            </div>
          </div>

          <Button
            onClick={() => onAuthChoice("login")}
            variant="outline"
            className="w-full h-14 text-lg font-bold border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <User className="mr-2 h-5 w-5" />
            Login
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
