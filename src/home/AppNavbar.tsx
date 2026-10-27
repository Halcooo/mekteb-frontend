import { useState } from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import mektebLogo from '../assets/mekteb.png';
import { useAuth } from '../hooks/useAuth';
import LanguageDropdown from '../components/LanguageDropdown';
import NotificationBell from '../components/NotificationBell';
import './AppNavbar.scss';

export default function AppNavbar() {
  const {t}=useTranslation(), location=useLocation();
  const {isAuthenticated,isLoading,isSigningOut,logout,user}=useAuth();
  const [expanded,setExpanded]=useState(false);
  const links=[{path:'/',label:t('home'),icon:'house-door'},...(isAuthenticated?[
    {path:'/messages',label:t('chat.title'),icon:'chat-dots'},
    ...(user?.role==='admin'?[{path:'/attendance',label:t('attendance'),icon:'calendar-check'}]:[]),
    ...(['admin','teacher'].includes(user?.role??'')?[{path:'/students',label:t('students'),icon:'people'}]:[]),
    ...(['parent','admin','user'].includes(user?.role??'')?[{path:'/parent-dashboard',label:t('parentDashboard.title'),icon:'person-hearts'}]:[]),
  ]:[])];
  return <Navbar expand="lg" expanded={expanded} onToggle={setExpanded} className="app-navbar" aria-label={t('menu')}>
    <Container fluid>
      <Navbar.Brand as={Link} to="/" onClick={()=>setExpanded(false)}><img src={mektebLogo} alt={t('mektebLogo')} className="navbar-brand-logo"/><span className="brand-copy"><strong>{t('mekteb')}</strong><small>{t('appName')}</small></span></Navbar.Brand>
      <div className="navbar-tools">
        {isAuthenticated&&<NotificationBell/>}
        <LanguageDropdown/>
        {isAuthenticated?<Dropdown align="end" className="account-dropdown"><Dropdown.Toggle variant="light" className="account-toggle" aria-label={t('accountMenu')}><span className="account-avatar">{user?.username.slice(0,2).toUpperCase()}</span><span className="account-name">{user?.username}<small>{t(`comments.${user?.role==='user'?'parent':user?.role}`)}</small></span></Dropdown.Toggle><Dropdown.Menu><Dropdown.Header>{user?.username}</Dropdown.Header><Dropdown.Item as={Link} to="/profile"><i className="bi bi-person-circle me-2"/>{t('profile')}</Dropdown.Item><Dropdown.Divider/><Dropdown.Item className="text-danger" onClick={()=>{void logout().catch(()=>{});}}><i className="bi bi-box-arrow-right me-2"/>{t('logout')}</Dropdown.Item></Dropdown.Menu></Dropdown>:!isLoading&&!isSigningOut&&<Link to="/login" className="btn btn-primary navbar-login">{t('login')}</Link>}
        <Navbar.Toggle aria-controls="mekteb-navbar-nav" label={t(expanded?'closeMenu':'menu')}/>
      </div>
      <Navbar.Collapse id="mekteb-navbar-nav"><Nav>{links.map(link=><Nav.Link as={Link} to={link.path} key={link.path} active={location.pathname===link.path} aria-current={location.pathname===link.path?'page':undefined} onClick={()=>setExpanded(false)}><i className={`bi bi-${link.icon}`}/>{link.label}</Nav.Link>)}</Nav></Navbar.Collapse>
    </Container>
  </Navbar>;
}
