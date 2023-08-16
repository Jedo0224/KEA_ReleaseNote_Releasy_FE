import { useState } from "react";
import axios from "interceptor/TokenCheck.js";

// react-router-dom components
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import Grid from "@mui/material/Grid";
import MuiLink from "@mui/material/Link";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import GitHubIcon from "@mui/icons-material/GitHub";
import GoogleIcon from "@mui/icons-material/Google";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

// Authentication layout components
import BasicLayout from "layouts/authentication/components/BasicLayout";

// Images
import bgImage from "assets/images/homepage/sign-in-background.png";

function CreateGroup() {

    const [groupName, setGroupName] = useState("");

    const location = useLocation();
    const email = location.state?.email;
    console.log(email);
    const navigate = useNavigate(); 

    const handleGroupNameChange = (event) => {
      setGroupName(event.target.value);
    };
  
    const handleSubmit = (event) => {
        // POST 요청을 보내는 부분
        axios.post("/api/member/rejoin/group", {
          email: email,
          groupName: groupName,
          // 다른 데이터들도 추가로 설정할 수 있습니다.
        })
        .then((response) => {
            console.log(response)
            if (response.status === 200) {
                alert(response.data.message);
                window.location.href = "/authentication/sign-in";
              } // Alert 창을 띄웁니다.
        })
        .catch((error) => {
          // 요청이 실패한 경우의 처리
          console.error(error);
        });
      };
  
    const isGroupNameEmpty = groupName === "";

    return (
        <BasicLayout image={bgImage}>
            <Card>
                <MDBox
                    variant="gradient"
                    bgColor="info"
                    borderRadius="lg"
                    coloredShadow="info"
                    mx={2}
                    mt={-3}
                    p={2}
                    mb={1}
                    textAlign="center"
                >
                    <MDTypography variant="h4" fontWeight="medium" color="white" mt={1}>
                        회원가입 - 새 그룹 생성
                    </MDTypography>
                    <MDTypography display="block" variant="button" color="white" my={1}>
                        생성할 그룹의 이름을 입력해주세요.
                    </MDTypography>
                </MDBox>
                <MDBox pt={4} pb={3} px={3}>
                    <MDBox component="form" role="form">
                        <MDBox mb={2}>
                            <MDInput type="text" label="그룹 이름" fullWidth required value={groupName} onChange={handleGroupNameChange}/>
                        </MDBox>
                        { isGroupNameEmpty ? ( <MDTypography fontWeight="light" color="error" variant="caption">&nbsp;&nbsp;그룹 이름을 입력해주세요.</MDTypography> ) : <MDTypography> </MDTypography>}
                        <MDBox mt={4} mb={1}>
                            <MDButton variant="gradient" color="info" fullWidth disabled={isGroupNameEmpty} onClick={handleSubmit}>
                                그룹 생성
                            </MDButton>
                        </MDBox>
                    </MDBox>
                    <MDBox mt={3} mb={1} textAlign="center">
                        <MDTypography fontWeight="light" variant="caption">
                            “내 정보” 페이지에서 그룹 코드를 확인할 수 있으며,<br/>그룹 코드를 통해 구성원들이 참가할 수 있습니다.
                        </MDTypography>
                    </MDBox>
                </MDBox>
            </Card>
        </BasicLayout>
    );
}

export default CreateGroup;