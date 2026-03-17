import { useParams, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import EmberProfile from "@/components/EmberProfile";

const EmberPublicProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  if (!userId) {
    navigate("/");
    return null;
  }

  return (
    <AnimatePresence>
      <EmberProfile userId={userId} onClose={() => navigate(-1)} />
    </AnimatePresence>
  );
};

export default EmberPublicProfile;
