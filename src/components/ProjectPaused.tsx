import React from 'react';
import logo from '../assets/Main logo.png';

const ProjectPaused: React.FC = () => {
  return (
    <div className="project-paused">
      <div className="project-paused-card">
        <img src={logo} alt="Gooba" className="project-paused-logo" />
        <span className="project-paused-badge">Paused</span>
        <h1>Project Paused</h1>
        <p className="project-paused-en" dir="ltr">
          This project is paused by Google Teams. Please contact the project owner
          for further information.
        </p>
        <div className="project-paused-divider" aria-hidden="true" />
        <h2 dir="rtl">المشروع متوقف مؤقتًا</h2>
        <p className="project-paused-ar" dir="rtl">
          تم إيقاف هذا المشروع مؤقتًا بواسطة Google Teams. يرجى التواصل مع مالك
          المشروع للمزيد من المعلومات.
        </p>
      </div>
    </div>
  );
};

export default ProjectPaused;
