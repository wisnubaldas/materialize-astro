import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { useThemeColors } from '../../styles/theme';
import { Button } from './button';
import { Text } from './text';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Formats a date object into backend-friendly `YYYY-MM-DD`.
 * @param {Date} date - Date object.
 * @returns {string} Date string.
 */
function formatDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Parses `YYYY-MM-DD` into a local date object.
 * @param {string} value - Date string.
 * @returns {Date|null} Parsed date or null.
 */
function parseDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/**
 * Builds visible calendar cells for one month.
 * @param {Date} monthDate - Any date within the target month.
 * @returns {Array<{ key: string, date: Date|null }>} Calendar cells.
 */
function buildCalendarCells(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const cells = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push({ key: `empty-start-${index}`, date: null });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    cells.push({ key: `${year}-${month}-${day}`, date: new Date(year, month, day) });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-end-${cells.length}`, date: null });
  }

  return cells;
}

/**
 * Renders a shared date picker field with a calendar modal.
 * @param {{ label?: string, value: string, onChange: Function, placeholder?: string }} props - Date picker props.
 * @returns {React.ReactElement} Date picker input.
 */
export function DatePicker({ label = '', value, onChange, placeholder = 'YYYY-MM-DD' }) {
  const colors = useThemeColors();
  const parsedValue = parseDateValue(value);
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(parsedValue || new Date());
  const calendarCells = useMemo(() => buildCalendarCells(visibleMonth), [visibleMonth]);

  /**
   * Moves the calendar one month backward or forward.
   * @param {number} delta - Month offset.
   * @returns {void}
   */
  function moveMonth(delta) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  /**
   * Opens the modal and centers it around the current value when available.
   * @returns {void}
   */
  function openPicker() {
    setVisibleMonth(parsedValue || new Date());
    setIsOpen(true);
  }

  /**
   * Selects a calendar day and closes the modal.
   * @param {Date} date - Selected date.
   * @returns {void}
   */
  function selectDate(date) {
    onChange(formatDateValue(date));
    setIsOpen(false);
  }

  return (
    <View className="gap-3">
      {label ? <Text variant="label">{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        onPress={openPicker}
        className="min-h-14.5 flex-row items-center rounded-sm border border-border bg-card px-4"
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
      >
        <Text className={`flex-1 text-base ${value ? 'text-foreground' : 'text-muted-foreground'}`}>
          {value || placeholder}
        </Text>
        <MaterialCommunityIcons name="calendar-month" size={24} color={colors.muted} />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/40 px-4 pb-21">
          <View
            className="rounded-sm border border-border bg-card p-4"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View className="mb-4 flex-row items-center justify-between">
              <Button variant="ghost" size="icon" onPress={() => moveMonth(-1)}>
                <MaterialCommunityIcons name="chevron-left" size={26} color={colors.foreground} />
              </Button>
              <Text className="text-base font-extrabold text-foreground">
                {MONTH_LABELS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </Text>
              <Button variant="ghost" size="icon" onPress={() => moveMonth(1)}>
                <MaterialCommunityIcons name="chevron-right" size={26} color={colors.foreground} />
              </Button>
            </View>

            <View className="mb-2 flex-row">
              {DAY_LABELS.map((dayLabel, index) => (
                <View
                  key={`${dayLabel}-${index}`}
                  className="h-8 flex-1 items-center justify-center"
                >
                  <Text className="text-xs font-bold text-muted-foreground">{dayLabel}</Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {calendarCells.map((cell) => {
                const cellValue = cell.date ? formatDateValue(cell.date) : '';
                const isSelected = cellValue && cellValue === value;

                return (
                  <View key={cell.key} className="w-[14.2857%] p-1">
                    {cell.date ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => selectDate(cell.date)}
                        className="h-10 items-center justify-center rounded-sm"
                        style={{
                          backgroundColor: isSelected ? colors.primary : colors.mutedBackground,
                        }}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            isSelected ? 'text-primary-foreground' : 'text-foreground'
                          }`}
                        >
                          {cell.date.getDate()}
                        </Text>
                      </Pressable>
                    ) : (
                      <View className="h-10" />
                    )}
                  </View>
                );
              })}
            </View>

            <View className="mt-4 flex-row gap-3">
              <Button variant="outline" className="flex-1" onPress={() => setIsOpen(false)}>
                <Text>Batal</Text>
              </Button>
              <Button className="flex-1" onPress={() => selectDate(new Date())}>
                <Text>Hari Ini</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
