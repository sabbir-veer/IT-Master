import { describe, it, expect } from 'vitest';
import { filterQuestions } from '@/lib/quiz-engine';
import { Dataset, Question } from '@/types/dataset';

const mockQuestions: Question[] = [
  {
    id: 'NET_01',
    topic: 'osi_model',
    question: 'Which OSI layer is responsible for routing?',
    options: ['Physical', 'Data Link', 'Network', 'Transport'],
    answer: 2,
    explanation: 'Network layer handles logical addressing and packet routing.',
    difficulty: 'easy',
  },
  {
    id: 'NET_02',
    topic: 'osi_model',
    question: 'Which OSI layer handles frames and MAC addresses?',
    options: ['Application', 'Data Link', 'Session', 'Network'],
    answer: 1,
    explanation: 'Data Link layer handles frame encapsulation and MAC addresses.',
    difficulty: 'medium',
  },
  {
    id: 'NET_03',
    topic: 'tcp_ip',
    question: 'Which protocol is connectionless in TCP/IP?',
    options: ['TCP', 'UDP', 'BGP', 'SSH'],
    answer: 1,
    explanation: 'UDP provides connectionless, unreliable datagram service.',
    difficulty: 'easy',
  },
  {
    id: 'NET_04',
    topic: 'tcp_ip',
    question: 'What is the standard port number for HTTPS?',
    options: ['80', '443', '22', '53'],
    answer: 1,
    explanation: 'Port 443 is assigned for HTTPS / TLS traffic.',
    difficulty: 'easy',
  },
  {
    id: 'NET_05',
    topic: 'routing',
    question: 'Which routing protocol uses Dijkstra shortest path algorithm?',
    options: ['RIP', 'OSPF', 'BGP', 'EIGRP'],
    answer: 1,
    explanation: 'OSPF uses Dijkstra (SPF) algorithm to calculate loop-free paths.',
    difficulty: 'hard',
  },
];

const mockDataset: Dataset = {
  dataset_id: 'networking_batch1',
  title: 'Computer Networks Batch 1',
  subject: 'networking',
  topics: {
    osi_model: 'OSI Model Layers',
    tcp_ip: 'TCP/IP Protocol Suite',
    routing: 'Routing & Switching',
  },
  questions: mockQuestions,
};

describe('Reading Mode Engine & Sequential Flow', () => {
  it('preserves natural sequential question ordering without shuffling', () => {
    const { matchedQuestions } = filterQuestions([mockDataset], {
      datasetId: 'networking_batch1',
      subject: 'networking',
      selectedTopics: [],
      difficulty: 'all',
      questionCount: 9999,
    });

    expect(matchedQuestions).toHaveLength(5);
    // Verify sequence is identical to mockQuestions order
    expect(matchedQuestions[0].id).toBe('NET_01');
    expect(matchedQuestions[1].id).toBe('NET_02');
    expect(matchedQuestions[2].id).toBe('NET_03');
    expect(matchedQuestions[3].id).toBe('NET_04');
    expect(matchedQuestions[4].id).toBe('NET_05');
  });

  it('filters reading questions by selected topics', () => {
    const { matchedQuestions } = filterQuestions([mockDataset], {
      datasetId: 'networking_batch1',
      subject: 'networking',
      selectedTopics: ['osi_model', 'routing'],
      difficulty: 'all',
      questionCount: 9999,
    });

    expect(matchedQuestions).toHaveLength(3);
    expect(matchedQuestions.map((q) => q.id)).toEqual(['NET_01', 'NET_02', 'NET_05']);
  });

  it('correctly calculates pagination boundaries', () => {
    const questions = mockQuestions;
    const pageSize = 2;
    const totalPages = Math.ceil(questions.length / pageSize);
    expect(totalPages).toBe(3);

    // Page 1
    const page1 = questions.slice(0, 2);
    expect(page1.map((q) => q.id)).toEqual(['NET_01', 'NET_02']);

    // Page 2
    const page2 = questions.slice(2, 4);
    expect(page2.map((q) => q.id)).toEqual(['NET_03', 'NET_04']);

    // Page 3
    const page3 = questions.slice(4, 6);
    expect(page3.map((q) => q.id)).toEqual(['NET_05']);
  });

  it('filters questions by keyword search', () => {
    const query = 'dijkstra';
    const matches = mockQuestions.filter(
      (q) =>
        q.question.toLowerCase().includes(query) ||
        (q.explanation && q.explanation.toLowerCase().includes(query))
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('NET_05');
  });
});
