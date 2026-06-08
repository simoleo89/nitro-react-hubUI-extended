import { FC, FormEvent, useCallback, useRef, useState } from 'react';
import { GetConfiguration } from '../../api';
import './LoginView.css';

// Login screen ported from Nitro-V3's LoginView, re-skinned with hubUI's
// palette (teal-blue: primary #1E7295 / secondary #16688A / info #299ccc) and
// rewritten for React 18 (no useActionState/useFormStatus — plain onSubmit).
// Register/forgot full dialogs from V3 are intentionally omitted; the recognizable
// reception backdrop + login card stack is what's reproduced here.
const interpolate = (value?: string | null): string =>
{
    if(!value) return '';

    return value.replace(/\$\{([^}]+)\}/g, (_, key: string) =>
    {
        try
        {
            return GetConfiguration<string>(key, '') || '';
        }
        catch
        {
            return '';
        }
    });
};

export interface LoginViewProps
{
    onAuthenticated: (ssoTicket: string) => void;
    isEntering?: boolean;
}

export const LoginView: FC<LoginViewProps> = ({ onAuthenticated, isEntering = false }) =>
{
    const [ username, setUsername ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ rememberMe, setRememberMe ] = useState(false);
    const [ error, setError ] = useState<string | null>(null);
    const [ info, setInfo ] = useState<string | null>(null);
    const [ submitting, setSubmitting ] = useState(false);
    const submitTimeRef = useRef(0);

    const loginViewConfig = GetConfiguration<Record<string, any>>('loginview', {}) || {};
    const loginImages = (loginViewConfig.images as Record<string, string>) || {};
    const backgroundColor = loginImages['background.colour'] || GetConfiguration<string>('login_background.colour', '');
    const background = interpolate(loginImages['background'] || GetConfiguration<string>('login_background', ''));
    const sun = interpolate(loginImages['sun'] || '');
    const drape = interpolate(loginImages['drape'] || '');
    const left = interpolate(loginImages['left'] || '');
    const right = interpolate(loginImages['right'] || '');

    const loginUrl = GetConfiguration<string>('login.endpoint', '/api/auth/login');

    // Reception art points at the hotel webserver; hide layers that fail to load
    // (e.g. server offline) so we fall back cleanly to the hubUI gradient.
    const hideOnError = (event: React.SyntheticEvent<HTMLImageElement>) =>
    {
        event.currentTarget.style.display = 'none';
    };

    const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();

        if(isEntering || submitting) return;

        const nowTs = Date.now();
        if(nowTs - submitTimeRef.current < 1000) return;
        submitTimeRef.current = nowTs;

        const usernameInput = username.trim();

        if(!usernameInput || !password)
        {
            setError('Please enter both your Habbo name and password.');
            return;
        }

        setError(null);
        setInfo(null);
        setSubmitting(true);

        try
        {
            const response = await fetch(loginUrl, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'NitroLoginView'
                },
                body: JSON.stringify({ username: usernameInput, password, remember: rememberMe })
            });

            let payload: Record<string, unknown> = {};
            try
            {
                payload = await response.json();
            }
            catch
            { }

            const ssoTicket = typeof payload.ssoTicket === 'string' ? payload.ssoTicket : (typeof payload.sso === 'string' ? payload.sso : '');

            if(response.ok && ssoTicket)
            {
                onAuthenticated(ssoTicket);
                return;
            }

            setError(typeof payload.error === 'string' ? payload.error : 'Invalid Habbo name or password.');
        }
        catch
        {
            setError('Unable to reach the login service. Please try again.');
        }
        finally
        {
            setSubmitting(false);
        }
    }, [ isEntering, submitting, username, password, rememberMe, loginUrl, onAuthenticated ]);

    return (
        <div className="nitro-login-view hubui-login" style={ backgroundColor ? { background: backgroundColor } : undefined }>
            { background ? <img className="login-background login-layer login-layer-img" src={ background } alt="" draggable={ false } onError={ hideOnError } /> : null }
            { sun ? <img className="login-sun login-layer login-layer-img" src={ sun } alt="" draggable={ false } onError={ hideOnError } /> : null }
            { drape ? <img className="login-drape login-layer login-layer-img" src={ drape } alt="" draggable={ false } onError={ hideOnError } /> : null }
            { left ? <img className="login-left login-layer login-layer-img" src={ left } alt="" draggable={ false } onError={ hideOnError } /> : null }
            { right ? <img className="login-right login-layer login-layer-img" src={ right } alt="" draggable={ false } onError={ hideOnError } /> : null }

            <div className="login-brand">
                <div className="login-brand-logo">Habbo</div>
                <div className="login-brand-sub">Hotel</div>
            </div>

            <div className="login-stack">
                <div className="nitro-login-card">
                    <div className="card-title">First time here?</div>
                    <div className="card-body register-card-body">
                        <span>Don't have an account yet?</span>
                        <a onClick={ () => setInfo('You can create your account on the website.') }>You can create one here</a>
                    </div>
                </div>

                <div className="nitro-login-card">
                    <div className="card-title">What's your Habbo called?</div>
                    <form className="card-body" onSubmit={ handleSubmit } autoComplete="on">
                        <div className="field">
                            <label htmlFor="login-username">Name of your Habbo</label>
                            <input
                                id="login-username"
                                name="username"
                                autoComplete="username"
                                type="text"
                                maxLength={ 32 }
                                value={ username }
                                onChange={ e => setUsername(e.target.value) }
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="login-password">Password</label>
                            <input
                                id="login-password"
                                name="password"
                                autoComplete="current-password"
                                type="password"
                                maxLength={ 128 }
                                value={ password }
                                onChange={ e => setPassword(e.target.value) }
                            />
                        </div>
                        <label className="remember-row">
                            <input
                                type="checkbox"
                                checked={ rememberMe }
                                onChange={ e => setRememberMe(e.target.checked) }
                            />
                            <span>Remember me</span>
                        </label>
                        { error && <div className="error-line">{ error }</div> }
                        { info && <div className="info-line">{ info }</div> }
                        <div className="submit-row">
                            <button type="submit" className="ok-button" disabled={ submitting || isEntering }>
                                { isEntering ? 'Entering…' : (submitting ? 'Checking…' : 'Log in') }
                            </button>
                        </div>
                        <a className="forgot" onClick={ () => setInfo('Password recovery is available on the website.') }>Forgotten your password?</a>
                    </form>
                </div>
            </div>
        </div>
    );
};
