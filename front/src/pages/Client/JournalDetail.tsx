import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import JournalDetailDisplay from "@/components/JournalDetailDisplay";
import { useSelector } from "react-redux";
import type { User } from "@/types/userType";
import { enqueueSnackbar } from "notistack";
import type { JournalComment, JournalDetail } from "@/types/JournalType";


export default function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [journal, setJournal] = useState<JournalDetail | null>(null);
  const [comments, setComments] = useState<JournalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const reduxUser = useSelector((state: any) => state.user);
  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      try {
        const response = await controller.getOne(`${endpoints.users}/user`, reduxUser.id);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
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
            destination: backendData.destination,
            createdAt: backendData.createdAt,
            author: backendData.author,
            photos: backendData.photos?.map((photo: any) =>
              typeof photo === 'string' ? photo : photo.url
            ) || [],
            likes: backendData.likes,
            public: backendData.public,
            comments: backendData.comments
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

    const fetchComments = async () => {
      try {
        const response = await controller.getAll(`${endpoints.journals}/${id}/comments`);

        if (response && response.data) {
          const mappedComments: JournalComment[] = response.data.map((comment: any) => ({
            id: comment._id || comment.id,
            author: {
              name: comment.authorId?.fullName || comment.authorId?.name || "Anonymous",
              avatarUrl: comment.authorId?.profileImage?.url || comment.authorId?.avatarUrl
            },
            content: comment.content,
            createdAt: comment.createdAt
          }));

          setComments(mappedComments);
        }
      } catch (err: any) {
        console.error("Error fetching comments:", err);
      }
    };

    fetchUser();
    fetchJournal();
    fetchComments();
  }, [id]);

  const handleToggleLike = async () => {
    if (!journal) return;

    try {
      const response = await controller.post(`${endpoints.journals}/${journal.id}/like`, {});
      if (response && response.data) {
        const { isLiked } = response.data;

        setJournal((prev) => {
          if (!prev) return prev;

          const updatedLikes = [...prev.likes];

          if (isLiked) {
            updatedLikes.push({ userId: reduxUser.id, createdAt: new Date().toISOString() });
          } else {
            const idx = updatedLikes.findIndex((l: any) =>
              String(l.userId?._id || l.userId) === String(reduxUser.id)
            );
            if (idx > -1) updatedLikes.splice(idx, 1);
          }

          return { ...prev, likes: updatedLikes };
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleAddComment = async (text: string) => {
    if (!journal || !text.trim()) return;

    try {
      const response = await controller.post(`${endpoints.journals}/${journal.id}/comments`, {
        content: text.trim()
      });

      if (response && response.data) {
        const newComment: JournalComment = {
          id: response.data._id || response.data.id,
          author: {
            name: response.data.authorId?.fullName || response.data.authorId?.name || "You",
            avatarUrl: response.data.authorId?.profileImage?.url || response.data.authorId?.avatarUrl
          },
          content: response.data.content,
          createdAt: response.data.createdAt
        };

        setComments(prev => [newComment, ...prev]);
      }
    } catch (error) {
      enqueueSnackbar('Error adding comment:', { variant: 'error' });
    }
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
      user={user}
      journal={journal}
      comments={comments}
      onBack={handleBack}
      onToggleLike={handleToggleLike}
      onAddComment={handleAddComment}
    />
  );
}
