import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Save a household's review of a collector. The review document id is the
 * pickup id, so each pickup can only be reviewed once. The collector's
 * average rating is calculated from the reviews collection when needed,
 * which means a household never has to write to another user's profile.
 */
export const submitReview = async ({ requestId, collectorId, rating, review, tags }) => {
  const now = new Date().toISOString();
  const batch = writeBatch(db);
  batch.set(doc(db, 'reviews', requestId), {
    requestId,
    collectorId,
    userId: auth.currentUser.uid,
    rating,
    review: review.trim(),
    tags,
    createdAt: now,
  });
  batch.update(doc(db, 'pickupRequests', requestId), {
    userRating: rating,
    userReview: review.trim(),
    ratingTags: tags,
    ratedAt: now,
  });
  await batch.commit();
};

/** Returns { average, count } for a collector */
export const getCollectorRating = async (collectorId) => {
  if (!collectorId) return { average: 0, count: 0 };
  const snap = await getDocs(query(collection(db, 'reviews'), where('collectorId', '==', collectorId)));
  const ratings = snap.docs.map((d) => Number(d.data().rating) || 0).filter(Boolean);
  if (ratings.length === 0) return { average: 0, count: 0 };
  const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return { average: Math.round(average * 10) / 10, count: ratings.length };
};
