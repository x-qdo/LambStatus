import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { signin, signinOKTA, forgotPassword, setCodeAndPassword, checkCode } from 'actions/users'
import { push } from 'react-router-redux'
import Signin from './Signin'

const mapStateToProps = (state) => {
  return {}
}

function mapDispatchToProps (dispatch) {
  return bindActionCreators({signin, signinOKTA, forgotPassword, setCodeAndPassword, checkCode, push}, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(Signin)
