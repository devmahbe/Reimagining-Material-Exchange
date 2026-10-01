import colors from './colors';

// Pickup lifecycle: pending → accepted → on-the-way → at-location → completed
// (a household may cancel while pending/accepted)
export const STATUS_META = {
  pending: { label: 'অপেক্ষমাণ', icon: 'hourglass-outline', color: colors.warning, bg: colors.warningSoft, message: 'একজন সংগ্রাহক খোঁজা হচ্ছে...' },
  accepted: { label: 'গৃহীত', icon: 'checkmark-circle-outline', color: colors.info, bg: colors.infoSoft, message: 'সংগ্রাহক আপনার অনুরোধ গ্রহণ করেছেন' },
  'on-the-way': { label: 'পথে আছেন', icon: 'bicycle-outline', color: colors.accent, bg: colors.accentSoft, message: 'সংগ্রাহক আপনার ঠিকানায় আসছেন' },
  'at-location': { label: 'পৌঁছেছেন', icon: 'location-outline', color: colors.purple, bg: colors.purpleSoft, message: 'সংগ্রাহক আপনার ঠিকানায় পৌঁছেছেন' },
  completed: { label: 'সম্পন্ন', icon: 'checkmark-done-outline', color: colors.success, bg: colors.successSoft, message: 'পিকআপ সফলভাবে সম্পন্ন হয়েছে' },
  cancelled: { label: 'বাতিল', icon: 'close-circle-outline', color: colors.error, bg: colors.errorSoft, message: 'পিকআপটি বাতিল করা হয়েছে' },
};

// Older documents may contain 'in-progress'; treat it like at-location.
export const getStatusMeta = (status) =>
  STATUS_META[status] || (status === 'in-progress' ? STATUS_META['at-location'] : STATUS_META.pending);

export const ACTIVE_STATUSES = ['accepted', 'on-the-way', 'at-location', 'in-progress'];

export const TIMELINE_STEPS = [
  { key: 'pending', label: 'অনুরোধ পাঠানো হয়েছে', timeField: 'createdAt' },
  { key: 'accepted', label: 'সংগ্রাহক গ্রহণ করেছেন', timeField: 'acceptedAt' },
  { key: 'on-the-way', label: 'সংগ্রাহক পথে', timeField: 'onTheWayAt' },
  { key: 'at-location', label: 'ঠিকানায় পৌঁছেছেন', timeField: 'atLocationAt' },
  { key: 'completed', label: 'সম্পন্ন ও পরিশোধিত', timeField: 'completedAt' },
];
