import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  AppState,
  AppStateStatus,
} from 'react-native';
import { Colors, Spacing, FontSize, FontWeight, Radii } from '../../lib/constants';
import { Button } from '../ui/Button';
import { generateBookQuiz, QuizQuestion } from '../../lib/ai';

const PASS_THRESHOLD = 7;  // 7 out of 10
const TOTAL_SECONDS  = 60;

interface Props {
  visible: boolean;
  bookTitle: string;
  bookAuthor: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OpenAIQuizModal({ visible, bookTitle, bookAuthor, onClose, onSuccess }: Props) {
  const [quizState, setQuizState]       = useState<'intro' | 'loading' | 'active'>('intro');
  const [questions, setQuestions]       = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore]               = useState(0);
  const [selected, setSelected]         = useState<number | null>(null);
  const [timeLeft, setTimeLeft]         = useState(TOTAL_SECONDS);
  const backgroundedAt                  = useRef<number | null>(null);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => {
        setQuestions([]);
        setCurrentIndex(0);
        setScore(0);
        setSelected(null);
        setQuizState('intro');
        setTimeLeft(TOTAL_SECONDS);
        backgroundedAt.current = null;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Double-speed anti-cheat — track time spent in background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (quizState !== 'active') return;

      if (nextState.match(/inactive|background/)) {
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active' && backgroundedAt.current !== null) {
        // Elapsed real seconds × 2 = penalty seconds
        const elapsed = (Date.now() - backgroundedAt.current) / 1000;
        const penalty = Math.ceil(elapsed * 2);
        backgroundedAt.current = null;
        setTimeLeft((prev) => Math.max(0, prev - penalty));
      }
    });
    return () => sub.remove();
  }, [quizState]);

  // Countdown
  useEffect(() => {
    if (quizState !== 'active') return;
    if (timeLeft <= 0) {
      handleForceFail('Time Up', `You ran out of time. You need ${PASS_THRESHOLD}/10 correct to pass.`);
      return;
    }
    const t = setTimeout(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [quizState, timeLeft]);

  function handleForceFail(title: string, message: string) {
    setQuizState('intro');
    Alert.alert(title, message, [{ text: 'OK', onPress: onClose }]);
  }

  async function startQuiz() {
    setQuizState('loading');
    const quiz = await generateBookQuiz(bookTitle, bookAuthor);
    if (!quiz || quiz.length === 0) {
      Alert.alert('Quiz Unavailable', 'Could not generate a quiz right now. Try again later.');
      onClose();
      return;
    }
    setQuestions(quiz);
    setTimeLeft(TOTAL_SECONDS);
    setQuizState('active');
  }

  function handleNext() {
    if (selected === null) return;

    const isCorrect = selected === questions[currentIndex].correctIndex;
    const newScore  = isCorrect ? score + 1 : score;

    if (currentIndex < questions.length - 1) {
      setScore(newScore);
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    } else {
      // Final question — evaluate
      if (newScore >= PASS_THRESHOLD) {
        onSuccess();
      } else {
        Alert.alert(
          'Quiz Failed',
          `You scored ${newScore}/10. You need at least ${PASS_THRESHOLD} correct answers to confirm you read this book.`,
          [{ text: 'Try Again Later', onPress: onClose }]
        );
      }
    }
  }

  if (!visible) return null;

  const timerPct = timeLeft / TOTAL_SECONDS;
  const timerColor =
    timerPct > 0.4 ? Colors.gold : timerPct > 0.2 ? Colors.accent : Colors.danger;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {quizState === 'active' ? `Question ${currentIndex + 1} / ${questions.length}` : 'Book Quiz'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>

          {/* Intro */}
          {quizState === 'intro' && (
            <View style={styles.center}>
              <Text style={styles.warningEmoji}>📖</Text>
              <Text style={styles.warningTitle}>Prove you read it</Text>
              <Text style={styles.warningText}>
                10 questions · 60 seconds · Pass with {PASS_THRESHOLD}/10 correct
              </Text>
              <View style={styles.ruleCard}>
                <Text style={styles.ruleTitle}>⚡ Anti-Cheat Rules</Text>
                <Text style={styles.ruleItem}>• Minimize or exit the app → timer runs at double speed</Text>
                <Text style={styles.ruleItem}>• Timer reaches zero → quiz fails immediately</Text>
                <Text style={styles.ruleItem}>• Passing unlocks your review and confirms the book</Text>
              </View>
              <Button
                label={`Start Quiz — "${bookTitle}"`}
                onPress={startQuiz}
                size="lg"
                fullWidth
                style={{ marginTop: Spacing.lg }}
              />
            </View>
          )}

          {/* Loading */}
          {quizState === 'loading' && (
            <View style={styles.center}>
              <ActivityIndicator color={Colors.accent} size="large" />
              <Text style={styles.loadingText}>Generating quiz with AI…</Text>
            </View>
          )}

          {/* Active quiz */}
          {quizState === 'active' && questions.length > 0 && (
            <View style={styles.quizContainer}>

              {/* Timer bar */}
              <View style={styles.timerBarBg}>
                <View
                  style={[
                    styles.timerBarFill,
                    { width: `${timerPct * 100}%`, backgroundColor: timerColor },
                  ]}
                />
              </View>
              <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>

              {/* Question */}
              <Text style={styles.questionText}>
                {questions[currentIndex].question}
              </Text>

              {/* Options */}
              <View style={styles.options}>
                {questions[currentIndex].options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.optionBtn, isSelected && styles.optionSelected]}
                      onPress={() => setSelected(idx)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>
                        <Text style={[styles.optionLetterText, isSelected && { color: '#fff' }]}>
                          {String.fromCharCode(65 + idx)}
                        </Text>
                      </View>
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                label={currentIndex === questions.length - 1 ? 'Finish' : 'Next →'}
                onPress={handleNext}
                disabled={selected === null}
                fullWidth
                size="lg"
                style={{ marginTop: 'auto' }}
              />
            </View>
          )}

        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  closeBtn: { padding: Spacing.xs },
  closeBtnText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  warningEmoji: { fontSize: 64 },
  warningTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    textAlign: 'center',
  },
  warningText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  ruleCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  ruleTitle: {
    color: Colors.gold,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  ruleItem: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  quizContainer: {
    flex: 1,
    gap: Spacing.md,
  },
  timerBarBg: {
    height: 4,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: 2,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  timerText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    textAlign: 'right',
    marginTop: -Spacing.xs,
  },
  questionText: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    lineHeight: 28,
    marginTop: Spacing.sm,
  },
  options: {
    gap: Spacing.sm,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  optionSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionLetterSelected: {
    backgroundColor: Colors.accent,
  },
  optionLetterText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  optionText: {
    color: Colors.text,
    fontSize: FontSize.md,
    flex: 1,
  },
  optionTextSelected: {
    color: Colors.text,
    fontWeight: FontWeight.semibold,
  },
});
