import LoginForm from '../../components/login/LoginForm';



const Login = () => {
    return (
       
        <>
        <div className="flex flex-col lg:flex-row lg:justify-around justify-center  space-y-3  p-8 lg:mx-20  2xl:mx-60 xl:mx-32 items-center h-screen bg-gray-00">

        <div className="flex flex-col justify-center items-center lg:items-start ">

                <img  className="-ml-14 w-90 h-21 mt-16 pb-8"
                 src="../../assets/images/logo1.svg" alt="logo" />
                <p className="font-normal w-[24rem] p-1 text-center lg:text-[2rem] lg:text-left lg:mr-12 text-gray-700  text-2xl lg:w-auto">
                    Share your content, articles, and experiences in the digital field with others with Tec_Social_Media.
                    </p>
            </div>
           <div>
                <LoginForm />
           </div>
        </div>
        </>
    );
    };

export default Login;
