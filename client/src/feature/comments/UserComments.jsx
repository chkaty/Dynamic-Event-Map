import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fetchUserComments, removeComment } from "../../services/commentsService";
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

function normalize(s) {
  return (s || "").toString().toLowerCase();
}

function status(item) {
  if (!item?.event) return null;
  const now = new Date();
  const starts = item.event.startsAt ? new Date(item.event.startsAt) : null;
  const ends = item.event.endsAt ? new Date(item.event.endsAt) : null;
  if (ends && ends < now) return "Event Expired";
  if (starts && starts <= now && (!ends || ends >= now)) return "Event In Progress";
  return null;
}

const CommentListItem = ({ item, onDelete, pending }) => {

  const hasPosition = item.event && 
    typeof item.event.position?.lat === "number" && 
    typeof item.event.position?.lng === "number";
  
  const googleStreetView = hasPosition && API_KEY
    ? `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${item.event.position.lat},${item.event.position.lng}&fov=90&heading=235&pitch=10&key=${API_KEY}`
    : null;

  const eventStatus = status(item);
  const isExpired = eventStatus === "Event Expired";

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    await onDelete(item.event.id, item.comment.id);
  };

  return (
    <div
      className={[
        "card relative bg-base-200 shadow-sm transition",
        isExpired ? "grayscale opacity-60" : "",
      ].join(" ")}
    >
      {eventStatus && (
        <span
          className={[
            "absolute left-4 top-4 rounded-md px-2 py-0.5 text-xs font-semibold z-10",
            eventStatus === "Event In Progress"
              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
              : "bg-slate-200 text-slate-700 border border-slate-300",
          ].join(" ")}
        >
          {eventStatus}
        </span>
      )}

      <div className="card-body p-4">
        <div className="flex items-start gap-4">
          {/* Event Image */}
          {item.event && (
            <div className="flex-none w-40 md:w-56 aspect-[4/3]">
              <img
                src={item.event.img || googleStreetView || `https://picsum.photos/seed/${item.event.id}/400/300`}
                alt={item.event.title || "Event"}
                className="h-full w-full rounded object-cover"
              />
              {item.event.startsAt && (
                <div className="mt-1 text-xs text-base-content/50">
                  <strong>Starts:</strong> {new Date(item.event.startsAt).toLocaleDateString()}
                </div>
              )}
              {item.event.endsAt && (
                <div className="mt-1 text-xs text-base-content/50">
                  <strong>Ends:</strong> {new Date(item.event.endsAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Comment Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="card-title text-lg">
                  {item.event?.title || `Event ${item.event?.id || 'Unknown'}`}
                </h3>

                <div className="mt-2">
                  <p className="text-sm text-base-content/80 whitespace-pre-wrap">{item.comment.text}</p>
                </div>

                {item.event?.locationAddress && (
                  <p className="mt-1 text-xs text-base-content/50">
                    {item.event.locationAddress}
                  </p>
                )}

                <p className="mt-1 text-xs text-base-content/40">
                  Commented: {new Date(item.comment.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    className={`btn btn-sm ${pending ? "btn-disabled" : "btn-ghost"} text-error`}
                    onClick={handleDelete}
                    disabled={pending}
                    title="Delete comment"
                  >
                    {pending ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserComments() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingOps, setPendingOps] = useState(new Set());
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("created-desc");

  useEffect(() => {
    loadComments();
  }, []);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await fetchUserComments();
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setLoading(false);
    }
  };

  // const handleUpdate = async (eventId, commentId, text) => {
  //   const key = `update-${commentId}`;
  //   setPendingOps((prev) => new Set(prev).add(key));
  //   try {
  //     await updateComment(eventId, commentId, text);
  //     setComments((prev) =>
  //       prev.map((item) => 
  //         item.comment.id === commentId 
  //           ? { ...item, comment: { ...item.comment, text } } 
  //           : item
  //       )
  //     );
  //   } finally {
  //     setPendingOps((prev) => {
  //       const next = new Set(prev);
  //       next.delete(key);
  //       return next;
  //     });
  //   }
  // };

  const handleDelete = async (eventId, commentId) => {
    const key = `delete-${commentId}`;
    setPendingOps((prev) => new Set(prev).add(key));
    try {
      await removeComment(eventId, commentId);
      setComments((prev) => prev.filter((item) => item.comment.id !== commentId));
    } catch (err) {
      console.error("Failed to delete comment:", err);
      alert("Failed to delete comment");
    } finally {
      setPendingOps((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const filteredSorted = useMemo(() => {
    const matches = comments.filter((item) => {
      if (!q) return true;
      const hay = [
        item.comment.text,
        item.event?.title,
        item.event?.locationAddress,
      ]
        .map(normalize)
        .join(" ");
      return hay.includes(normalize(q));
    });

    const sorted = [...matches];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "title-asc":
          return normalize(a.event?.title).localeCompare(normalize(b.event?.title));
        case "title-desc":
          return normalize(b.event?.title).localeCompare(normalize(a.event?.title));
        case "created-asc":
          return new Date(a.comment.createdAt) - new Date(b.comment.createdAt);
        case "created-desc":
        default:
          return new Date(b.comment.createdAt) - new Date(a.comment.createdAt);
      }
    });

    return sorted;
  }, [comments, q, sortKey]);

  const expiredCount = useMemo(
    () => comments.filter((item) => status(item) === "Event Expired").length,
    [comments]
  );

  const removeExpired = useCallback(async () => {
    if (!expiredCount) return;
    const ok = window.confirm(`Remove ${expiredCount} comment(s) on expired events?`);
    if (!ok) return;

    const tasks = comments
      .filter((item) => status(item) === "Event Expired")
      .map((item) => handleDelete(item.event.id, item.comment.id));
    await Promise.allSettled(tasks);
  }, [comments, expiredCount]);

  if (loading) {
    return (
      <div className="card bg-base-100">
        <div className="card-body">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="card-title">My Comments</h2>
            <p className="text-sm opacity-70">
              {comments.length} total · {expiredCount} on expired events
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
            {/* Search */}
            <label className="input input-sm flex items-center gap-2 w-full" aria-label="Search comments">
              <svg
                className="h-4 opacity-60"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </g>
              </svg>
              <input
                type="search"
                placeholder="Search comment/event/address"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none"
              />
              {q && (
                <button
                  className="text-xs opacity-60 hover:opacity-100"
                  onClick={() => setQ("")}
                  type="button"
                >
                  Clear
                </button>
              )}
            </label>

            {/* Sort */}
            <select
              className="select select-sm w-full"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              title="Sort by"
            >
              <option value="created-desc">Recently commented</option>
              <option value="created-asc">Oldest first</option>
              <option value="title-asc">Event Title A–Z</option>
              <option value="title-desc">Event Title Z–A</option>
            </select>

            {/* Remove expired */}
            <button
              type="button"
              className="btn btn-sm btn-outline btn-error"
              disabled={!expiredCount}
              onClick={removeExpired}
              title={expiredCount ? "Remove comments on expired events" : "No comments on expired events"}
            >
              Remove expired
            </button>
          </div>
        </div>

        {/* Display comments */}
        <div className="mt-4 grid gap-4">
          {filteredSorted.length === 0 ? (
            <div className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>
                {q ? "No comments match your search." : "No comments yet."}
              </span>
            </div>
          ) : (
            filteredSorted.map((item) => (
              <CommentListItem
                key={item.comment.id}
                item={item}
                onDelete={handleDelete}
                pending={pendingOps.has(`delete-${item.comment.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
