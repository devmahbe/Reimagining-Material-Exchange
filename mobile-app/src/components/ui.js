import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import { font, radius, shadow, spacing, TOUCH } from '../constants/theme';
import { getStatusMeta } from '../constants/status';
import { getInitial } from '../utils/helpers';

// ─── Header ────────────────────────────────────────────────────────────────────

/**
 * Gradient app header that extends under the status bar.
 * Pass `onBack` for a back button, `right` for trailing actions and
 * `children` for extra content (e.g. a search bar) below the title.
 */
export function AppHeader({ title, subtitle, onBack, right, children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.primaryDark, colors.primary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, { paddingTop: insets.top + spacing.md }, style]}
    >
      <View style={styles.headerRow}>
        {onBack ? (
          <IconButton icon="arrow-back" onPress={onBack} accessibilityLabel="ফিরে যান" />
        ) : null}
        <View style={[styles.headerTitleWrap, !onBack && { marginLeft: 0 }]}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        <View style={styles.headerRight}>{right}</View>
      </View>
      {children}
    </LinearGradient>
  );
}

export function IconButton({ icon, onPress, badge, color = colors.white, style, accessibilityLabel }) {
  return (
    <TouchableOpacity
      style={[styles.iconBtn, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
    >
      <Ionicons name={icon} size={22} color={color} />
      {badge > 0 ? (
        <View style={styles.iconBadge}>
          <Text style={styles.iconBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Buttons ───────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = {
  primary: { bg: colors.primary, fg: colors.white, border: colors.primary },
  accent: { bg: colors.accent, fg: colors.white, border: colors.accent },
  outline: { bg: colors.white, fg: colors.primary, border: colors.primary },
  soft: { bg: colors.primarySoft, fg: colors.primary, border: colors.primarySoft },
  danger: { bg: colors.white, fg: colors.error, border: colors.error },
  ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  size = 'lg',
  style,
  textStyle,
}) {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor: v.bg, borderColor: v.border },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 20} color={v.fg} /> : null}
          <Text style={[styles.buttonText, size === 'sm' && styles.buttonTextSm, { color: v.fg }, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Layout pieces ─────────────────────────────────────────────────────────────

export function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionHeader({ title, actionLabel, onAction, style }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Sticky bar at the bottom of the screen that respects the home indicator */
export function BottomBar({ children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }, style]}>
      {children}
    </View>
  );
}

export function BottomNav({ items, active }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={isActive ? undefined : item.onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.navIconWrap, isActive && styles.navIconWrapActive]}>
              <Ionicons
                name={isActive ? item.icon : `${item.icon}-outline`}
                size={22}
                color={isActive ? colors.primary : colors.textLight}
              />
              {item.badge > 0 ? <View style={styles.navDot} /> : null}
            </View>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Feedback ──────────────────────────────────────────────────────────────────

export function LoadingView({ message = 'লোড হচ্ছে...', style }) {
  return (
    <View style={[styles.centerFill, style]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, message, actionLabel, onAction, style }) {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel ? (
        <AppButton title={actionLabel} onPress={onAction} size="sm" style={{ marginTop: spacing.lg, alignSelf: 'center' }} />
      ) : null}
    </View>
  );
}

export function StatusBadge({ status, style }) {
  const meta = getStatusMeta(status);
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }, style]}>
      <Ionicons name={meta.icon} size={13} color={meta.color} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {icon ? <Ionicons name={icon} size={15} color={active ? colors.white : colors.textBody} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Avatar({ name, size = 44, color = colors.primary, bg = colors.primarySoft, icon }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      {icon ? (
        <Ionicons name={icon} size={size * 0.5} color={color} />
      ) : (
        <Text style={[styles.avatarText, { color, fontSize: size * 0.42 }]}>{getInitial(name)}</Text>
      )}
    </View>
  );
}

export function InfoRow({ icon, label, value, onPress, last }) {
  const content = (
    <View style={[styles.infoRow, last && { borderBottomWidth: 0 }]}>
      {icon ? (
        <View style={styles.infoIcon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textLight} /> : null}
    </View>
  );
  return onPress ? <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity> : content;
}

// ─── Forms ─────────────────────────────────────────────────────────────────────

export function FormField({ label, icon, error, right, style, inputStyle, multiline, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={[styles.fieldBox, multiline && styles.fieldBoxMultiline, error && styles.fieldBoxError]}>
        {icon ? <Ionicons name={icon} size={20} color={colors.textGray} style={styles.fieldIcon} /> : null}
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline, inputStyle]}
          placeholderTextColor={colors.textLight}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...inputProps}
        />
        {right}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  headerTitleWrap: { flex: 1, marginLeft: spacing.sm },
  headerTitle: { fontSize: font.xl, fontWeight: '700', color: colors.white },
  headerSubtitle: { fontSize: font.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: { fontSize: 10, fontWeight: '800', color: colors.white },

  button: {
    minHeight: TOUCH + 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonSm: { minHeight: 40, paddingHorizontal: spacing.lg, borderRadius: radius.sm + 2 },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontSize: font.md + 1, fontWeight: '700' },
  buttonTextSm: { fontSize: font.sm },

  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.sm,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  sectionAction: { fontSize: font.sm, fontWeight: '600', color: colors.primary },

  bottomBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    ...shadow.lg,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: TOUCH },
  navIconWrap: {
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconWrapActive: { backgroundColor: colors.primarySoft },
  navDot: {
    position: 'absolute',
    top: 3,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  navLabel: { fontSize: font.xs, color: colors.textLight, marginTop: 3, fontWeight: '500' },
  navLabelActive: { color: colors.primary, fontWeight: '700' },

  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  loadingText: { marginTop: spacing.md, color: colors.textGray, fontSize: font.md },

  empty: { alignItems: 'center', paddingVertical: spacing.xxxl, paddingHorizontal: spacing.xl },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: { fontSize: font.lg, fontWeight: '700', color: colors.text, textAlign: 'center' },
  emptyMessage: { fontSize: font.sm + 1, color: colors.textGray, textAlign: 'center', marginTop: spacing.sm, lineHeight: 21 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: font.xs + 1, fontWeight: '700' },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    minHeight: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: font.sm, fontWeight: '600', color: colors.textBody },
  chipTextActive: { color: colors.white },

  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '800' },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.md,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: font.xs + 1, color: colors.textGray },
  infoValue: { fontSize: font.md, color: colors.text, fontWeight: '600', marginTop: 2 },

  field: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: font.sm, fontWeight: '600', color: colors.textBody, marginBottom: spacing.sm },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: TOUCH + 4,
  },
  fieldBoxMultiline: { alignItems: 'flex-start', paddingVertical: spacing.sm },
  fieldBoxError: { borderColor: colors.error },
  fieldIcon: { marginRight: spacing.sm },
  fieldInput: { flex: 1, fontSize: font.md, color: colors.text, paddingVertical: spacing.sm },
  fieldInputMultiline: { minHeight: 80 },
  fieldError: { color: colors.error, fontSize: font.xs + 1, marginTop: 6 },
});
