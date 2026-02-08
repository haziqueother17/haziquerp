import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Loader2 } from "lucide-react";
import { joinGroupByCode } from "@/hooks/useGroupChat";
import { supabase } from "@/integrations/supabase/client";

export default function JoinGroup() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndJoin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth with return URL
        navigate(`/auth?redirect=/join/${inviteCode}`);
        return;
      }

      setIsChecking(false);
    };

    checkAuthAndJoin();
  }, [inviteCode, navigate]);

  const handleJoin = async () => {
    if (!inviteCode) return;
    
    setIsJoining(true);
    const groupId = await joinGroupByCode(inviteCode);
    
    if (groupId) {
      navigate(`/group/${groupId}`);
    } else {
      setIsJoining(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong p-8 rounded-2xl max-w-md w-full text-center"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-primary-foreground" />
        </div>

        <h1 className="font-display text-2xl font-semibold mb-2">
          You've Been Invited!
        </h1>
        <p className="text-muted-foreground mb-6">
          Join this group chat and start chatting with friends and AI characters together.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2"
        >
          {isJoining ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <Users className="w-5 h-5" />
              Join Group Chat
            </>
          )}
        </motion.button>

        <button
          onClick={() => navigate("/")}
          className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Go back home
        </button>
      </motion.div>
    </div>
  );
}
