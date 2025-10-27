import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './faq.css';

const FaqPage = ({ onPageChange }) => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqItems = [
    {
      question: t('faq.howToRegister'),
      answer: t('faq.howToRegisterAnswer')
    },
    {
      question: t('faq.howToDeposit'),
      answer: t('faq.howToDepositAnswer')
    },
    {
      question: t('faq.howToWithdraw'),
      answer: t('faq.howToWithdrawAnswer')
    },
    {
      question: t('faq.whatGamesAvailable'),
      answer: t('faq.whatGamesAvailableAnswer')
    },
    {
      question: t('faq.whatIsKYC'),
      answer: t('faq.whatIsKYCAnswer')
    },
    {
      question: t('faq.howLongKYC'),
      answer: t('faq.howLongKYCAnswer')
    },
    {
      question: t('faq.minimumDeposit'),
      answer: t('faq.minimumDepositAnswer')
    },
    {
      question: t('faq.whatArePromoCodes'),
      answer: t('faq.whatArePromoCodesAnswer')
    },
    {
      question: t('faq.isSafe'),
      answer: t('faq.isSafeAnswer')
    },
    {
      question: t('faq.howToContact'),
      answer: t('faq.howToContactAnswer')
    }
  ];

  return (
    <div className="faq-page">
      <div className="faq-container">
        <h1 className="faq-title">{t('faq.frequentlyAskedQuestions')}</h1>
        <p className="faq-subtitle">{t('faq.findAnswers')}</p>
        
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div key={index} className="faq-item">
              <button
                className={`faq-question ${openIndex === index ? 'open' : ''}`}
                onClick={() => toggleQuestion(index)}
              >
                <span>{item.question}</span>
                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="faq-footer">
          <p>{t('faq.stillHaveQuestions')}</p>
          <a href="mailto:support@axion-play.su" className="faq-contact-link">
            {t('faq.contactSupport')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
