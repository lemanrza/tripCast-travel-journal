import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import JournalDetailDisplay from "@/components/JournalDetailDisplay";

export type JournalComment = {
  id: string;
  author: { name: string; avatarUrl?: string };
  content: string;
  createdAt: string | Date;
};

export type JournalDetail = {
  id: string;
  title: string;
  author: { name: string; avatarUrl?: string };
  content: string; // notes/body
  createdAt: string | Date;
  photos: string[]; // image urls
  likesCount?: number;
  likedByMe?: boolean;
};


export default function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [journal, setJournal] = useState<JournalDetail | null>(null);
  const [comments] = useState<JournalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchJournal = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await controller.getOne(endpoints.journals, id);

        console.log("Raw response:", response.data);

        if (response && response.data) {
          const backendData = response.data;
          const mappedJournal: JournalDetail = {
            id: backendData._id || backendData.id,
            title: backendData.title,
            content: backendData.content,
            createdAt: backendData.createdAt,
            author: {
              name: backendData.author?.fullName || backendData.author?.name || "Unknown Author",
              avatarUrl: backendData.author?.profileImage?.url || backendData.author?.avatarUrl
            },
            photos: backendData.photos?.map((photo: any) => 
              typeof photo === 'string' ? photo : photo.url
            ) || [],
            likesCount: backendData.likes?.length || 0,
          };
          
          console.log("Mapped journal data:", mappedJournal);
          setJournal(mappedJournal);
        } else {
          throw new Error('No journal data in response');
        }
      } catch (err: any) {
        console.error("Error fetching journal:", err);
        setError(err.message || 'Failed to fetch journal');
      } finally {
        setLoading(false);
      }
    };

    fetchJournal();
  }, [id]);

  const handleToggleLike = async () => {
    if (!journal) return;

    try {
      const response = await controller.post(`${endpoints.journals}/${journal.id}/like`, {});

      if (response.ok) {
        const data = await response.json();
        setJournal(data.data);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (text: string) => {
    if (!journal) return;

    console.log('Adding comment:', text);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Journal Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This journal entry could not be found.'}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <JournalDetailDisplay
      journal={journal}
      comments={comments}
      onBack={handleBack}
      onToggleLike={handleToggleLike}
      onAddComment={handleAddComment}
    />
  );
}
