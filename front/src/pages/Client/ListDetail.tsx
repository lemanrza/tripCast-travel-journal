// src/pages/TravelListDetail.tsx
import { Link, useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Members from "@/components/ListDetail/Members";

import controller from "@/services/commonRequest";
import endpoints from "@/services/api";
import { enqueueSnackbar } from "notistack";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import type { List } from "@/types/ListType";
import type { JournalDetail } from "@/types/JournalType";
import { getEntityId, safeToArray } from "@/utils/entityId";
import ListHero from "@/components/ListDetail/ListHero";
import ListSettingsModals from "@/components/ListDetail/ListSettingsModal";
import StatsRow from "@/components/ListDetail/StatsRow";
import DestinationsTab from "@/components/ListDetail/DestinationsTab";
import JournalsTab from "@/components/ListDetail/JournalsTab";
import PhotosTab from "@/components/ListDetail/PhotosTab";

export default function TravelListDetail() {
  const { id: listId } = useParams();
  const [listData, setListData] = useState<List | null>(null);
  const [journals, setJournals] = useState<JournalDetail[]>([]);
  const [journalsLoading, setJournalsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = useSelector((state: any) => state.user);
  const isOwner = listData?.owner?._id === user.id;

  // Fetch data
  useEffect(() => {
    async function fetchAll() {
      if (!listId) {
        setError("No list ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [listRes, journalsRes] = await Promise.all([
          controller.getOne(endpoints.lists, listId),
          (async () => {
            setJournalsLoading(true);
            try {
              const r = await controller.getAll(`${endpoints.journals}/list/${listId}`);
              return r;
            } finally {
              setJournalsLoading(false);
            }
          })(),
        ]);

        if (listRes?.data) setListData(listRes.data);
        else setError("Failed to fetch list data");

        if (journalsRes?.data) setJournals(journalsRes.data);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [listId]);

  // Stats
  const stats = useMemo(() => {
    const d = listData?.destinations || [];
    const destCount = d.length || 0;
    const completedCount = d.filter((x: any) => x.status === "completed").length || 0;
    const memberCount = (listData?.collaborators || []).length || 0;
    const journalCount = d.reduce((sum, dd) => sum + (Array.isArray(dd.journals) ? dd.journals.length : 0), 0) || 0;
    return { destCount, completedCount, memberCount, journalCount };
  }, [listData]);

  // Journals: create
  const handleCreateJournal = async (payload: any) => {
    if (!listId) throw new Error("No list ID");
    try {
      const photoUrls: Array<{ url: string; public_id: string }> = [];
      for (const file of safeToArray<File>(payload.photos)) {
        const fd = new FormData();
        fd.append("image", file);
        const uploadResponse = await controller.post(`${endpoints.upload}/image`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (uploadResponse?.success && uploadResponse.data?.url) {
          photoUrls.push({ url: uploadResponse.data.url, public_id: uploadResponse.data.public_id });
        }
      }

      const destinationId = getEntityId(payload.destination);
      const journalPayload = {
        title: payload.title,
        content: payload.content,
        destination: destinationId,
        listId,
        public: payload.public,
        photos: photoUrls,
      };

      const response = await controller.post(endpoints.journals, journalPayload);
      if (!response?.data) throw new Error("Failed to create journal entry");

      const created: JournalDetail = response.data;
      setJournals((prev) => [created, ...prev]);
      setListData((prev: any) => {
        if (!prev) return prev;
        const updatedDestinations = (prev.destinations || []).map((dest: any) =>
          getEntityId(dest) === destinationId
            ? { ...dest, journals: [created, ...(Array.isArray(dest.journals) ? dest.journals : [])] }
            : dest
        );
        return { ...prev, destinations: updatedDestinations };
      });

      enqueueSnackbar(`✅ Journal entry "${payload.title}" created successfully!`, { variant: "success" });
    } catch (error: any) {
      console.error("Error creating journal:", error);
      enqueueSnackbar(`❌ Failed to create journal: ${error.message || "Unknown error"}`, { variant: "error" });
      throw error;
    }
  };

  // Journals: optimistic delete
  const handleDeleteJournal = async (journal: JournalDetail) => {
    const jId = getEntityId(journal);

    const prevJournals = journals;
    const prevListData = listData;

    // optimistic UI
    setJournals((prev) => prev.filter((j) => getEntityId(j) !== jId));
    setListData((prev: any) => {
      if (!prev) return prev;
      const updatedDestinations = (prev.destinations || []).map((d: any) => {
        const jArr = Array.isArray(d.journals) ? d.journals : [];
        return { ...d, journals: jArr.filter((jj: any) => getEntityId(jj) !== jId) };
      });
      return { ...prev, destinations: updatedDestinations };
    });

    try {
      const resp = await controller.deleteOne(endpoints.journals, jId);
      const ok = resp?.success !== false; // accept 204 / empty body
      if (!ok) {
        setJournals(prevJournals);
        setListData(prevListData as any);
        enqueueSnackbar(resp?.message || "Failed to delete journal", { variant: "error" });
        return;
      }

      enqueueSnackbar("✅ Journal entry deleted successfully", { variant: "success" });

      // best-effort asset cleanup
      const publicIds = safeToArray((journal as any).photos).map((p: any) => p?.public_id).filter(Boolean);
      for (const pid of publicIds) {
        try {
          await controller.deleteOne(`${endpoints.upload}/image`, encodeURIComponent(pid));
        } catch {}
      }
    } catch (err: any) {
      setJournals(prevJournals);
      setListData(prevListData as any);
      enqueueSnackbar(err?.message || "Failed to delete journal", { variant: "error" });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading list details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error: {error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  const listTitle = listData?.title || "European Adventure 2024";
  const description = listData?.description || "Exploring the historic cities and beautiful landscapes of Europe";
  const tags = listData?.tags || ["culture", "history", "food"];

  return (
    <div className="mx-auto max-w-8xl px-4 pb-16">
      {/* Back */}
      <div className="mb-4 text-sm">
        <Link to={"/dashboard"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">← Back to Dashboard</Link>
      </div>

      {/* Hero (with Settings button & modals injected) */}
      <ListHero
        title={listTitle}
        description={description}
        tags={tags}
        coverImage={listData?.coverImage}
        extraActions={
          <ListSettingsModals
            listId={String(listId)}
            listData={listData}
            setListData={setListData}
            currentUserId={user.id}
            isOwner={!!isOwner}
          />
        }
      />

      {/* Stats */}
      <StatsRow
        destCount={stats.destCount}
        completedCount={stats.completedCount}
        memberCount={stats.memberCount}
        journalCount={stats.journalCount}
      />

      {/* Members */}
      {listData?.collaborators && listData.collaborators.length > 0 && (
        <Members
          isThisListMe={!!isOwner}
          currentUserId={user.id}
          collaborators={(listData?.collaborators || []).map((u: any) => ({
            ...u,
            id: u._id || u.id,
            avatarUrl: u.profileImage?.url,
          }))}
          onSearchUsers={async (q) => {
            const response = await controller.getAll(`${endpoints.users}/search?q=${encodeURIComponent(q)}`);
            if (response && response.data) {
              return response.data.map((uu: any) => ({
                id: uu._id || uu.id,
                email: uu.email,
                fullName: uu.fullName,
                avatarUrl: uu.profileImage?.url,
                collaboratorsRequest: uu.collaboratorsRequest || [],
              }));
            }
            return [];
          }}
          onInvite={async (collaboratorEmail) => {
            await controller.post(`${endpoints.lists}/${listId}/invite`, { collaboratorEmail });
          }}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="destinations" className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="journals">Journal Entries</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
        </TabsList>

        <TabsContent value="destinations">
          <DestinationsTab
            listId={String(listId)}
            listData={listData}
            setListData={setListData}
            isOwner={!!isOwner}
          />
        </TabsContent>

        <TabsContent value="journals">
          <JournalsTab
            destinations={listData?.destinations || []}
            journals={journals}
            journalsLoading={journalsLoading}
            currentUserId={user.id}
            onCreate={handleCreateJournal}
            onDelete={handleDeleteJournal}
          />
        </TabsContent>

        <TabsContent value="photos">
          <PhotosTab journals={journals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
