import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { render } from '@mantine-tests/core';
import { LayersLayoutDemo } from './demo';

describe('isolated Layers layout', () => {
  afterEach(() => jest.useRealTimers());

  it('starts with the kit welcome and sends into visible processing', () => {
    render(<LayersLayoutDemo />);
    expect(screen.getByRole('heading', { name: 'С чего начнём?' })).toBeVisible();
    fireEvent.change(screen.getByPlaceholderText('Спросите о задачах, страницах или проектах'), {
      target: { value: 'Найди план на неделю' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    expect(screen.getByRole('button', { name: 'Остановить' })).toBeVisible();
    expect(screen.getByText('Обрабатываю')).toBeVisible();
  });

  it('stops processing without later completing the demo write', () => {
    jest.useFakeTimers();
    render(<LayersLayoutDemo initialScenario="create" />);
    fireEvent.change(screen.getByPlaceholderText('Спросите о задачах, страницах или проектах'), {
      target: { value: 'Создай страницу' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Остановить' }));
    act(() => jest.advanceTimersByTime(20000));
    expect(screen.getByText('Остановлено. Ничего не изменено.')).toBeVisible();
    expect(screen.queryByText('Страница создана.')).not.toBeInTheDocument();
  });

  it('waits indefinitely for approval and respects rejection', () => {
    jest.useFakeTimers();
    render(<LayersLayoutDemo initialScenario="create" />);
    fireEvent.change(screen.getByPlaceholderText('Спросите о задачах, страницах или проектах'), {
      target: { value: 'Создай страницу' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    act(() => jest.advanceTimersByTime(1600));
    expect(screen.getByRole('button', { name: 'Создать' })).toBeVisible();
    act(() => jest.advanceTimersByTime(20000));
    expect(screen.getByRole('button', { name: 'Создать' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Не создавать' }));
    act(() => jest.advanceTimersByTime(20000));
    expect(screen.getByText('Не создаю страницу.')).toBeVisible();
    expect(screen.queryByText('Страница создана.')).not.toBeInTheDocument();
  });

  it('does not claim nothing changed when stopped after approved creation', () => {
    jest.useFakeTimers();
    render(<LayersLayoutDemo initialScenario="create" />);
    fireEvent.change(screen.getByPlaceholderText('Спросите о задачах, страницах или проектах'), {
      target: { value: 'Создай страницу' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    act(() => jest.advanceTimersByTime(1600));
    fireEvent.click(screen.getByRole('button', { name: 'Создать' }));
    act(() => jest.advanceTimersByTime(2400));
    fireEvent.click(screen.getByRole('button', { name: 'Остановить' }));
    expect(screen.getByText('Страница уже создана. Ответ остановлен.')).toBeVisible();
    expect(screen.queryByText('Остановлено. Ничего не изменено.')).not.toBeInTheDocument();
  });

  it('closes pending consent when stopped', () => {
    jest.useFakeTimers();
    render(<LayersLayoutDemo initialScenario="create" />);
    fireEvent.change(screen.getByPlaceholderText('Спросите о задачах, страницах или проектах'), {
      target: { value: 'Создай страницу' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    act(() => jest.advanceTimersByTime(1600));
    fireEvent.click(screen.getByRole('button', { name: 'Остановить' }));
    expect(screen.queryByRole('button', { name: 'Создать' })).not.toBeInTheDocument();
  });

  it('settles the streamed answer with real demo page links', () => {
    jest.useFakeTimers();
    render(<LayersLayoutDemo />);
    fireEvent.change(screen.getByPlaceholderText('Спросите о задачах, страницах или проектах'), {
      target: { value: 'Найди страницы' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));
    act(() => jest.advanceTimersByTime(1600));
    act(() => jest.advanceTimersByTime(2400));
    act(() => jest.advanceTimersByTime(20000));
    expect(screen.getByRole('link', { name: 'План на неделю' })).toHaveAttribute(
      'href',
      '#page=plan'
    );
    expect(screen.queryByRole('button', { name: 'Остановить' })).not.toBeInTheDocument();
  });
});
