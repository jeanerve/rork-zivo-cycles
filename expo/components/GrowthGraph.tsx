import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Text, PanResponder, Platform, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/providers/ThemeProvider';
import { GraphDataPoint } from '@/types';

interface GrowthGraphProps {
  data: GraphDataPoint[];
  height?: number;
  showLabels?: boolean;
  accentColor?: string;
  showDots?: boolean;
  title?: string;
  showContributionMarkers?: boolean;
  interactive?: boolean;
  placeholder?: boolean;
}

const SAMPLE_DATA: GraphDataPoint[] = [
  { date: '2026-03-01', amount: 0, type: 'deposit', changeAmount: 0 },
  { date: '2026-03-05', amount: 25, type: 'deposit', changeAmount: 25 },
  { date: '2026-03-10', amount: 80, type: 'deposit', changeAmount: 55 },
  { date: '2026-03-14', amount: 120, type: 'deposit', changeAmount: 40 },
  { date: '2026-03-18', amount: 95, type: 'withdrawal', changeAmount: 25 },
  { date: '2026-03-22', amount: 180, type: 'deposit', changeAmount: 85 },
  { date: '2026-03-26', amount: 250, type: 'deposit', changeAmount: 70 },
  { date: '2026-03-28', amount: 320, type: 'deposit', changeAmount: 70 },
];

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default React.memo(function GrowthGraph({
  data,
  height = 180,
  showLabels = true,
  accentColor,
  showDots = true,
  showContributionMarkers: _showContributionMarkers = false,
  interactive = true,
  placeholder = false,
  title: _title = '',
}: GrowthGraphProps) {
  const { colors, isDark } = useTheme();
  const lineColor = accentColor ?? colors.green;
  const withdrawalColor = colors.red;
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState<number>(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  const displayData = placeholder ? SAMPLE_DATA : data;
  const isPlaceholder = placeholder || displayData.length === 0;
  const effectiveData = isPlaceholder ? SAMPLE_DATA : displayData;

  useEffect(() => {
    animatedProgress.setValue(0);
    Animated.timing(animatedProgress, {
      toValue: 1,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [effectiveData.length, animatedProgress]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - containerWidth) > 1) {
      setContainerWidth(w);
    }
  }, [containerWidth]);

  const maxAmount = useMemo(() => Math.max(...effectiveData.map((d) => d.amount), 1), [effectiveData]);

  const graphWidth = containerWidth;
  const padding = { top: 16, bottom: showLabels ? 26 : 10, left: 10, right: 10 };
  const chartHeight = height - padding.top - padding.bottom;
  const chartWidth = graphWidth - padding.left - padding.right;

  const points = useMemo(() => {
    if (effectiveData.length === 0) return [];
    if (effectiveData.length === 1) {
      const x = padding.left + chartWidth / 2;
      const y = padding.top + chartHeight * 0.3;
      return [{ x, y, amount: effectiveData[0].amount, date: effectiveData[0].date, type: effectiveData[0].type ?? 'deposit' as const, changeAmount: effectiveData[0].changeAmount ?? effectiveData[0].amount }];
    }
    return effectiveData.map((point, index) => {
      const x = padding.left + (index / (effectiveData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (point.amount / maxAmount) * chartHeight * 0.85;
      return { x, y, amount: point.amount, date: point.date, type: point.type ?? 'deposit' as const, changeAmount: point.changeAmount ?? point.amount };
    });
  }, [effectiveData, maxAmount, chartHeight, chartWidth, padding.left, padding.top]);

  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return path;
  }, [points]);

  const fillPath = useMemo(() => {
    if (points.length < 2) return '';
    const bottomY = padding.top + chartHeight;
    let path = `M ${points[0].x} ${bottomY}`;
    path += ` L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    path += ` L ${points[points.length - 1].x} ${bottomY} Z`;
    return path;
  }, [points, chartHeight, padding.top]);

  const gridLines = useMemo(() => {
    const lines: number[] = [];
    for (let i = 0; i <= 3; i++) {
      lines.push(padding.top + (i / 3) * chartHeight);
    }
    return lines;
  }, [chartHeight, padding.top]);

  const findClosestPoint = useCallback((touchX: number): number | null => {
    if (points.length === 0) return null;
    let closest = 0;
    let minDist = Math.abs(touchX - points[0].x);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(touchX - points[i].x);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    return closest;
  }, [points]);

  const showTooltip = useCallback((index: number | null) => {
    if (index !== null && index !== activeIndex) {
      setActiveIndex(index);
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, tooltipOpacity]);

  const hideTooltip = useCallback(() => {
    Animated.timing(tooltipOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex(null);
    });
  }, [tooltipOpacity]);

  const panResponder = useMemo(() => {
    if (!interactive || isPlaceholder) return null;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const idx = findClosestPoint(touchX);
        showTooltip(idx);
      },
      onPanResponderMove: (evt) => {
        const touchX = evt.nativeEvent.locationX;
        const idx = findClosestPoint(touchX);
        if (idx !== null) {
          setActiveIndex(idx);
        }
      },
      onPanResponderRelease: () => {
        hideTooltip();
      },
      onPanResponderTerminate: () => {
        hideTooltip();
      },
    });
  }, [interactive, isPlaceholder, findClosestPoint, showTooltip, hideTooltip]);

  const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const firstPoint = points.length > 0 ? points[0] : null;
  const totalAmount = lastPoint?.amount ?? 0;
  const growthPercent = firstPoint && firstPoint.amount > 0 && lastPoint
    ? (((lastPoint.amount - firstPoint.amount) / firstPoint.amount) * 100).toFixed(1)
    : totalAmount > 0 ? ((totalAmount / 1) * 100).toFixed(1) : null;

  const labelStep = Math.max(1, Math.floor(points.length / 4));

  const activePoint = activeIndex !== null && activeIndex < points.length ? points[activeIndex] : null;

  const activePointData = activeIndex !== null && activeIndex < effectiveData.length ? effectiveData[activeIndex] : null;
  const isWithdrawalPoint = activePointData?.type === 'withdrawal';
  const changeAmt = activePointData?.changeAmount ?? (activeIndex !== null && activeIndex > 0 && activeIndex < effectiveData.length
    ? Math.abs(effectiveData[activeIndex].amount - effectiveData[activeIndex - 1].amount)
    : activeIndex === 0 && effectiveData.length > 0
    ? effectiveData[0].amount
    : null);

  return (
    <View
      style={[styles.container, { height: height + 70 }]}
      onLayout={onLayout}
    >
      <View style={styles.headerSection}>
        <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>Your Savings</Text>
        <View style={styles.amountRow}>
          <Text style={[styles.bigAmount, { color: isPlaceholder ? colors.textMuted : colors.text }]}>
            {isPlaceholder ? '$0' : formatCurrency(totalAmount)}
          </Text>
          {growthPercent && Number(growthPercent) > 0 && !isPlaceholder && (
            <View style={[styles.percentBadge, { backgroundColor: colors.greenMuted }]}>
              <TrendingUp size={12} color={colors.green} />
              <Text style={[styles.percentText, { color: colors.green }]}>+{growthPercent}%</Text>
            </View>
          )}
        </View>

        <View style={styles.graphSubtitleRow}>
          <Text style={[styles.graphSubtitle, { color: colors.textSecondary }]}>YOUR SAVINGS</Text>
          {growthPercent && Number(growthPercent) > 0 && !isPlaceholder && (
            <View style={[styles.percentBadgeSmall, { backgroundColor: colors.greenMuted }]}>
              <Text style={[styles.percentTextSmall, { color: colors.green }]}>+{growthPercent}%</Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={styles.graphArea}
        {...(panResponder?.panHandlers ?? {})}
      >
        {activePoint && !isPlaceholder && (
          <Animated.View
            style={[
              styles.tooltip,
              {
                opacity: tooltipOpacity,
                left: Math.max(10, Math.min(activePoint.x - 60, containerWidth - 130)),
                top: -4,
                backgroundColor: colors.card,
                borderColor: isWithdrawalPoint ? colors.red + '40' : colors.green + '40',
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.tooltipTypeRow}>
              <View style={[styles.tooltipTypeDot, { backgroundColor: isWithdrawalPoint ? colors.red : colors.green }]} />
              <Text style={[styles.tooltipTypeLabel, { color: isWithdrawalPoint ? colors.red : colors.green }]}>
                {isWithdrawalPoint ? 'Withdrawal' : 'Deposit'}
              </Text>
            </View>
            <Text style={[styles.tooltipAmount, { color: isWithdrawalPoint ? colors.red : colors.green }]}>
              {changeAmt !== null
                ? `${isWithdrawalPoint ? '-' : '+'}${formatCurrency(changeAmt)}`
                : formatCurrency(activePoint.amount)}
            </Text>
            <Text style={[styles.tooltipDate, { color: colors.textMuted }]}>
              {formatDateFull(activePoint.date)}
            </Text>
            <Text style={[styles.tooltipTotal, { color: colors.textSecondary }]}>
              Balance: {formatCurrency(activePoint.amount)}
            </Text>
          </Animated.View>
        )}

        <Svg width={containerWidth} height={height} viewBox={`0 0 ${graphWidth} ${height}`}>
          <Defs>
            <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity={isPlaceholder ? '0.08' : (isDark ? '0.22' : '0.15')} />
              <Stop offset="0.5" stopColor={lineColor} stopOpacity={isPlaceholder ? '0.03' : '0.08'} />
              <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
            </LinearGradient>
            <LinearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={lineColor} stopOpacity={isPlaceholder ? '0.15' : '0.5'} />
              <Stop offset="0.5" stopColor={lineColor} stopOpacity={isPlaceholder ? '0.25' : '0.85'} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={isPlaceholder ? '0.3' : '1'} />
            </LinearGradient>
            <LinearGradient id="glowLine" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={lineColor} stopOpacity="0.0" />
              <Stop offset="0.5" stopColor={lineColor} stopOpacity={isPlaceholder ? '0.05' : '0.18'} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={isPlaceholder ? '0.08' : '0.3'} />
            </LinearGradient>
          </Defs>

          {gridLines.map((y, i) => (
            <Line
              key={`grid-${i}`}
              x1={padding.left}
              y1={y}
              x2={graphWidth - padding.right}
              y2={y}
              stroke={gridColor}
              strokeWidth={0.5}
            />
          ))}

          {fillPath ? <Path d={fillPath} fill="url(#areaFill)" /> : null}

          {linePath ? (
            <>
              <Path
                d={linePath}
                stroke="url(#glowLine)"
                strokeWidth={10}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={linePath}
                stroke="url(#lineStroke)"
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : null}

          {activePoint && !isPlaceholder && (
            <Line
              x1={activePoint.x}
              y1={padding.top}
              x2={activePoint.x}
              y2={padding.top + chartHeight}
              stroke={isWithdrawalPoint ? withdrawalColor : lineColor}
              strokeWidth={1}
              strokeDasharray="4,3"
              opacity={0.5}
            />
          )}

          {showDots && points.map((point, index) => {
            const isLast = index === points.length - 1;
            const isActive = activeIndex === index;
            const isWd = point.type === 'withdrawal';
            const dotColor = isWd ? withdrawalColor : lineColor;
            if (!isLast && !isActive && !isWd && points.length > 6 && index % Math.max(1, Math.floor(points.length / 6)) !== 0) return null;

            return (
              <React.Fragment key={`dot-${index}`}>
                {(isLast && !isPlaceholder) && (
                  <>
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={12}
                      fill={dotColor}
                      opacity={0.1}
                    />
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={7}
                      fill={dotColor}
                      opacity={0.18}
                    />
                  </>
                )}
                {isActive && !isPlaceholder && (
                  <>
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={14}
                      fill={dotColor}
                      opacity={0.12}
                    />
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={8}
                      fill={dotColor}
                      opacity={0.2}
                    />
                  </>
                )}
                {isWd && !isActive && !isLast && !isPlaceholder && (
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r={6}
                    fill={withdrawalColor}
                    opacity={0.12}
                  />
                )}
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={(isLast || isActive) ? 4.5 : isWd ? 3.5 : 2.5}
                  fill={(isLast || isActive || isWd) ? dotColor : isDark ? colors.card : '#fff'}
                  stroke={dotColor}
                  strokeWidth={(isLast || isActive) ? 2 : 1.5}
                  opacity={isPlaceholder ? 0.3 : 1}
                />
              </React.Fragment>
            );
          })}

          {points.length === 1 && (
            <>
              <Circle cx={points[0].x} cy={points[0].y} r={10} fill={lineColor} opacity={0.15} />
              <Circle cx={points[0].x} cy={points[0].y} r={5} fill={lineColor} />
            </>
          )}
        </Svg>

        {isPlaceholder && (
          <View style={styles.placeholderOverlay}>
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              Your growth will appear here
            </Text>
          </View>
        )}
      </View>

      {showLabels && points.length > 1 && (
        <View style={styles.labelsRow}>
          {points.map((point, index) => {
            if (index % labelStep !== 0 && index !== points.length - 1) return null;
            const leftPercent = (point.x / graphWidth) * 100;
            return (
              <Text
                key={`label-${index}`}
                style={[
                  styles.label,
                  {
                    left: `${leftPercent}%`,
                    color: isPlaceholder ? colors.textMuted + '60' : colors.textMuted,
                  },
                ]}
                numberOfLines={1}
              >
                {formatDateShort(point.date)}
              </Text>
            );
          })}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  headerSection: {
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  bigAmount: {
    fontSize: 36,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  percentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  graphSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  graphSubtitle: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  percentBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  percentTextSmall: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  graphArea: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 120,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
    }),
  },
  tooltipTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  tooltipTypeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipTypeLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  tooltipAmount: {
    fontSize: 14,
    fontWeight: '700' as const,
    marginBottom: 1,
  },
  tooltipDate: {
    fontSize: 11,
    fontWeight: '500' as const,
  },
  tooltipTotal: {
    fontSize: 11,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  labelsRow: {
    position: 'relative',
    height: 18,
    marginTop: 2,
  },
  label: {
    position: 'absolute',
    fontSize: 9,
    textAlign: 'center',
    width: 44,
    marginLeft: -22,
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
});
